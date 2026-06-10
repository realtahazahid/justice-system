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

    // Fetch database tables
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const clients = await prisma.client.findMany();
    const cases = await prisma.case.findMany();
    const hearings = await prisma.hearing.findMany();
    const payments = await prisma.payment.findMany();
    const history = await prisma.caseHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Retrieve documents and encode content to base64
    const dbDocs = await prisma.document.findMany();
    const documents = dbDocs.map(doc => ({
      id: doc.id,
      caseId: doc.caseId,
      name: doc.name,
      type: doc.type,
      mimeType: doc.mimeType,
      size: doc.size,
      createdAt: doc.createdAt,
      deletedAt: doc.deletedAt,
      contentBase64: doc.content ? Buffer.from(doc.content).toString('base64') : null,
    }));

    const backupPayload = {
      exportedAt: new Date().toISOString(),
      system: 'Sahi Law Chamber CMS',
      tables: {
        users,
        clients,
        cases,
        hearings,
        payments,
        documents,
        history,
      },
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set(
      'Content-Disposition',
      `attachment; filename="sahi_law_backup_${new Date().toISOString().split('T')[0]}.json"`
    );

    return new Response(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Database backup API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
