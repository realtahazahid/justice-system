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

    // Fetch all cases that are not soft-deleted, with client names
    const cases = await prisma.case.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    // CSV Header row
    const headers = [
      'File No',
      'Case Number',
      'Party Name',
      'Client Name',
      'Client Contact',
      'Client CNIC',
      'Court Category',
      'Court Name',
      'Referral',
      'Status',
      'Priority',
      'Total Fee (Rs.)',
      'Paid Fee (Rs.)',
      'Remaining Fee (Rs.)',
      'Notes',
      'Created At',
    ];

    // Helper to escape values for CSV
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      // Escape quotes by doubling them
      str = str.replace(/"/g, '""');
      // Wrap in double quotes if it contains quotes, commas, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvRows = [headers.join(',')];

    for (const c of cases) {
      const row = [
        escapeCSV(c.fileNo),
        escapeCSV(c.caseNumber),
        escapeCSV(c.partyName),
        escapeCSV(c.client.name),
        escapeCSV(c.contactNumber),
        escapeCSV(c.client.cnic),
        escapeCSV(c.courtCategory),
        escapeCSV(c.courtName),
        escapeCSV(c.referral),
        escapeCSV(c.status),
        escapeCSV(c.priority),
        escapeCSV(c.totalFee),
        escapeCSV(c.paidFee),
        escapeCSV(c.remainingFee),
        escapeCSV(c.notes),
        escapeCSV(c.createdAt.toISOString().split('T')[0]),
      ];
      csvRows.push(row.join(','));
    }

    // CSV Content with UTF-8 BOM to prevent Excel display corruption
    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/csv; charset=utf-8');
    responseHeaders.set(
      'Content-Disposition',
      `attachment; filename="sahi_law_cases_export_${new Date().toISOString().split('T')[0]}.csv"`
    );

    return new Response(csvContent, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Excel export API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
