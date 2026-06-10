import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ClientSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    const client = await prisma.client.findUnique({
      where: { id, deletedAt: null },
      include: {
        cases: {
          where: { deletedAt: null },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('GET /api/clients/[id] error:', error);
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
    const result = ClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const clientExists = await prisma.client.findUnique({
      where: { id, deletedAt: null },
    });

    if (!clientExists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { name, phone, cnic, address } = result.data;

    // Check if another client has the same CNIC
    const otherClient = await prisma.client.findFirst({
      where: { cnic, NOT: { id } },
    });

    if (otherClient) {
      return NextResponse.json({ error: { cnic: ['A client with this CNIC already exists'] } }, { status: 400 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: { name, phone, cnic, address },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/clients/[id] error:', error);
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

    const client = await prisma.client.findUnique({
      where: { id, deletedAt: null },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Soft delete the client
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Also soft-delete all cases for this client
    await prisma.case.updateMany({
      where: { clientId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Client and their cases soft-deleted' });
  } catch (error) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
