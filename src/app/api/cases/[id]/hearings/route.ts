import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HearingSchema } from '@/lib/validations';
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
    const result = HearingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = result.data;

    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id: caseId, deletedAt: null },
    });

    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Create the hearing
    const hearing = await prisma.hearing.create({
      data: {
        caseId,
        hearingDate: data.hearingDate,
        nextHearingDate: data.nextHearingDate,
        courtRemarks: data.courtRemarks,
        lawyerNotes: data.lawyerNotes,
        eventType: data.eventType,
      },
    });

    // Format hearing dates for audit description
    const formattedHearingDate = new Date(data.hearingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedNextDate = data.nextHearingDate
      ? new Date(data.nextHearingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not Scheduled';

    // Write audit trail
    await logCaseAction(
      caseId,
      'Hearing Added',
      `New schedule of type "${data.eventType}" set for ${formattedHearingDate}. Next scheduled hearing: ${formattedNextDate}.`,
      (session.user as any).id
    );

    return NextResponse.json(hearing, { status: 201 });
  } catch (error) {
    console.error('POST /api/cases/[id]/hearings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
