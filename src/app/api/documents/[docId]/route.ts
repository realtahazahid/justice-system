import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const { docId } = params;
    const document = await prisma.document.findUnique({
      where: { id: docId, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Convert Prisma Bytes to standard Buffer
    const buffer = Buffer.from(document.content);

    // Set headers for viewing in browser (inline) or downloading
    const headers = new Headers();
    headers.set('Content-Type', document.mimeType || 'application/pdf');
    headers.set(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.name)}"`
    );
    headers.set('Content-Length', buffer.length.toString());

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('GET /api/documents/[docId] error:', error);
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
    const { docId } = params;

    const document = await prisma.document.findUnique({
      where: { id: docId, deletedAt: null },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Soft delete the document
    await prisma.document.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });

    // Write audit trail
    await logCaseAction(
      document.caseId,
      'Document Deleted',
      `Deleted document "${document.name}" of type "${document.type}".`,
      (session.user as any).id
    );

    return NextResponse.json({ success: true, message: 'Document soft-deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/documents/[docId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
