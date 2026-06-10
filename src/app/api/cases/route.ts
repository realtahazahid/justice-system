import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CaseSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const courtCategory = searchParams.get('courtCategory') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    // Build Prisma query filter
    const whereClause: any = {
      deletedAt: null,
    };

    if (courtCategory) {
      whereClause.courtCategory = courtCategory;
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (q) {
      whereClause.OR = [
        { caseNumber: { contains: q, mode: 'insensitive' } },
        { courtName: { contains: q, mode: 'insensitive' } },
        { partyName: { contains: q, mode: 'insensitive' } },
        { fileNo: { contains: q, mode: 'insensitive' } },
        {
          client: {
            name: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: {
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cases);
  } catch (error) {
    console.error('GET /api/cases error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = CaseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = result.data;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId, deletedAt: null },
    });

    if (!client) {
      return NextResponse.json({ error: { clientId: ['Client does not exist'] } }, { status: 400 });
    }

    // Create the case
    const newCase = await prisma.case.create({
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
        paidFee: 0,
        remainingFee: data.totalFee,
      },
    });

    // Write audit trail
    await logCaseAction(
      newCase.id,
      'Case Created',
      `Case number "${data.caseNumber}" (${data.partyName}) initialized under Category "${data.courtCategory}" with a total fee of ${data.totalFee}.`,
      (session.user as any).id
    );

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
