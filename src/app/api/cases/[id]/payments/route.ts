import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

export async function POST(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id: caseId } = params;
    const body = await req.json();
    const result = PaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { amount, notes } = result.data;

    // We run the operations in a database transaction to ensure calculations are atomic
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Get the current case details
      const caseExists = await tx.case.findUnique({
        where: { id: caseId, deletedAt: null },
      });

      if (!caseExists) {
        throw new Error('Case not found');
      }

      // 2. Perform fee calculation
      const currentPaid = Number(caseExists.paidFee);
      const totalFee = Number(caseExists.totalFee);
      const newPaid = currentPaid + amount;
      const newRemaining = Math.max(0, totalFee - newPaid);

      // 3. Update the Case fee counters
      await tx.case.update({
        where: { id: caseId },
        data: {
          paidFee: newPaid,
          remainingFee: newRemaining,
        },
      });

      // 4. Create the payment history record
      return await tx.payment.create({
        data: {
          caseId,
          amount,
          notes,
        },
      });
    });

    // Write audit trail
    const caseDetails = await prisma.case.findUnique({
      where: { id: caseId },
    });

    await logCaseAction(
      caseId,
      'Fee Payment Added',
      `Payment of Rs. ${amount} received. Remaining fee balance: Rs. ${caseDetails?.remainingFee}. ${notes ? `Notes: "${notes}"` : ''}`,
      (session.user as any).id
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/cases/[id]/payments error:', error);
    if (error.message === 'Case not found') {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
