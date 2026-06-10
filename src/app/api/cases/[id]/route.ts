import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CaseSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const caseData = await prisma.case.findUnique({
      where: { id, deletedAt: null },
      include: {
        client: true,
        hearings: {
          where: { deletedAt: null },
          orderBy: { hearingDate: 'desc' },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { paymentDate: 'desc' },
        },
        documents: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        histories: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error('GET /api/cases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const body = await req.json();
    const result = CaseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = result.data;
    const existingCase = await prisma.case.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Determine what changed for the audit trail
    const auditLogs: string[] = [];

    if (existingCase.status !== data.status) {
      auditLogs.push(`Status changed from "${existingCase.status}" to "${data.status}"`);
    }
    if (existingCase.priority !== data.priority) {
      auditLogs.push(`Priority changed from "${existingCase.priority}" to "${data.priority}"`);
    }
    const currentTotalFee = Number(existingCase.totalFee);
    if (currentTotalFee !== data.totalFee) {
      auditLogs.push(`Total fee updated from Rs. ${currentTotalFee} to Rs. ${data.totalFee}`);
    }

    // Recalculate remaining fee
    const paidFee = Number(existingCase.paidFee);
    const newRemainingFee = data.totalFee - paidFee;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        courtCategory: data.courtCategory,
        courtName: data.courtName,
        caseNumber: data.caseNumber,
        fileNo: data.fileNo,
        referral: data.referral,
        partyName: data.partyName,
        clientId: data.clientId,
        contactNumber: data.contactNumber,
        notes: data.notes,
        status: data.status,
        priority: data.priority,
        totalFee: data.totalFee,
        remainingFee: newRemainingFee,
      },
    });

    // Write audit logs
    const userId = (session.user as any).id;
    if (existingCase.status !== data.status && data.status === 'CLOSED') {
      await logCaseAction(id, 'Case Closed', `The case has been marked as CLOSED.`, userId);
    } else if (existingCase.status !== data.status && data.status === 'ACTIVE') {
      await logCaseAction(id, 'Case Reopened', `The case has been marked as ACTIVE.`, userId);
    }

    if (auditLogs.length > 0) {
      await logCaseAction(
        id,
        'Case Details Updated',
        `Updated details: ${auditLogs.join(', ')}.`,
        userId
      );
    } else {
      await logCaseAction(id, 'Case Details Updated', `Minor details updated for the case.`, userId);
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('PUT /api/cases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const caseExists = await prisma.case.findUnique({
      where: { id, deletedAt: null },
    });

    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Soft delete the case and its cascading relations (hearings, payments, documents)
    await prisma.$transaction([
      prisma.case.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.hearing.updateMany({
        where: { caseId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.payment.updateMany({
        where: { caseId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.document.updateMany({
        where: { caseId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    // Log the deletion action in CaseHistory
    await logCaseAction(
      id,
      'Case Soft-Deleted',
      `The case file was soft-deleted by user. History remains intact.`,
      (session.user as any).id
    );

    return NextResponse.json({ success: true, message: 'Case soft-deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/cases/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
