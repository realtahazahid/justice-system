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

    // Group active cases by the referral string
    const grouped = await prisma.case.groupBy({
      by: ['referral'],
      where: {
        deletedAt: null,
        referral: {
          not: null,
          notIn: [''], // Ignore null and empty string referrals
        },
      },
      _count: {
        id: true,
      },
    });

    // Format and sort by case count descending
    const report = grouped
      .map((g) => ({
        referral: g.referral!,
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(report);
  } catch (error) {
    console.error('GET /api/reports/referrals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
