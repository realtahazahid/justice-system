import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id: caseId } = params;

    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId, deletedAt: null },
    });

    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!type || !['ORDER', 'JUDGMENT', 'PETITION', 'EVIDENCE', 'OTHER'].includes(type)) {
      return NextResponse.json({ error: 'Invalid or missing document type' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit' }, { status: 400 });
    }

    // Convert file to buffer for Prisma Bytes field
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save document to database
    const document = await prisma.document.create({
      data: {
        caseId,
        name: file.name,
        type,
        mimeType: file.type || 'application/pdf',
        content: buffer,
        size: file.size,
      },
      select: {
        id: true,
        name: true,
        type: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    // Write audit trail
    await logCaseAction(
      caseId,
      'Document Uploaded',
      `Uploaded document "${file.name}" of type "${type}" (${(file.size / 1024).toFixed(1)} KB).`,
      (session.user as any).id
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases/[id]/documents error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
