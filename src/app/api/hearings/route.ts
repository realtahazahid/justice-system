import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hearings = await prisma.hearing.findMany({
      where: {
        deletedAt: null,
        case: {
          deletedAt: null,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            partyName: true,
            courtCategory: true,
            courtName: true,
          },
        },
      },
      orderBy: { hearingDate: 'asc' },
    });

    return NextResponse.json(hearings);
  } catch (error) {
    console.error('GET /api/hearings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
