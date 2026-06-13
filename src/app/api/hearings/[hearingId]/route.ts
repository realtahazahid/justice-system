import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HearingSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logCaseAction } from '@/lib/audit';

export async function PUT(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { hearingId } = params;
    const body = await req.json();
    const result = HearingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = result.data;

    // Find the existing hearing
    const existingHearing = await prisma.hearing.findUnique({
      where: { id: hearingId, deletedAt: null },
    });

    if (!existingHearing) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });
    }

    // Determine what changed for the audit trail
    const auditLogs: string[] = [];

    const oldHearingDate = new Date(existingHearing.hearingDate).getTime();
    const newHearingDate = new Date(data.hearingDate).getTime();
    if (oldHearingDate !== newHearingDate) {
      const formattedOld = new Date(existingHearing.hearingDate).toLocaleString();
      const formattedNew = new Date(data.hearingDate).toLocaleString();
      auditLogs.push(`hearing date changed from ${formattedOld} to ${formattedNew}`);
    }

    const oldNextDate = existingHearing.nextHearingDate ? new Date(existingHearing.nextHearingDate).getTime() : null;
    const newNextDate = data.nextHearingDate ? new Date(data.nextHearingDate).getTime() : null;
    if (oldNextDate !== newNextDate) {
      const formattedOld = existingHearing.nextHearingDate ? new Date(existingHearing.nextHearingDate).toLocaleString() : 'None';
      const formattedNew = data.nextHearingDate ? new Date(data.nextHearingDate).toLocaleString() : 'None';
      auditLogs.push(`next hearing date updated from ${formattedOld} to ${formattedNew}`);
    }

    if (existingHearing.courtRemarks !== data.courtRemarks) {
      auditLogs.push(`court remarks updated to "${data.courtRemarks || ''}"`);
    }

    if (existingHearing.lawyerNotes !== data.lawyerNotes) {
      auditLogs.push(`private notes updated`);
    }

    if (existingHearing.eventType !== data.eventType) {
      auditLogs.push(`event type changed from "${existingHearing.eventType}" to "${data.eventType}"`);
    }

    const updatedHearing = await prisma.hearing.update({
      where: { id: hearingId },
      data: {
        hearingDate: data.hearingDate,
        nextHearingDate: data.nextHearingDate,
        courtRemarks: data.courtRemarks,
        lawyerNotes: data.lawyerNotes,
        eventType: data.eventType,
      },
    });

    // Write audit logs
    const userId = (session.user as any).id;
    if (auditLogs.length > 0) {
      await logCaseAction(
        existingHearing.caseId,
        'Hearing Updated',
        `Hearing details modified: ${auditLogs.join(', ')}.`,
        userId
      );
    }

    return NextResponse.json(updatedHearing);
  } catch (error) {
    console.error('PUT /api/hearings/[hearingId] error:', error);
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
    const { hearingId } = params;

    const hearing = await prisma.hearing.findUnique({
      where: { id: hearingId, deletedAt: null },
    });

    if (!hearing) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });
    }

    // Soft delete the hearing
    await prisma.hearing.update({
      where: { id: hearingId },
      data: { deletedAt: new Date() },
    });

    // Write audit trail
    const formattedDate = new Date(hearing.hearingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await logCaseAction(
      hearing.caseId,
      'Hearing Deleted',
      `Deleted scheduled hearing of type "${hearing.eventType}" for ${formattedDate}.`,
      (session.user as any).id
    );

    return NextResponse.json({ success: true, message: 'Hearing soft-deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/hearings/[hearingId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 550 });
  }
}
