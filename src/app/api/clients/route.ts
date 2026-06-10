import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ClientSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('GET /api/clients error:', error);
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
    const result = ClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, phone, cnic, address } = result.data;

    // Check if client with CNIC already exists
    const existingClient = await prisma.client.findFirst({
      where: { cnic },
    });

    if (existingClient) {
      if (existingClient.deletedAt) {
        // Reactivate soft-deleted client
        const reactivated = await prisma.client.update({
          where: { id: existingClient.id },
          data: { name, phone, address, deletedAt: null },
        });
        return NextResponse.json(reactivated, { status: 200 });
      }
      return NextResponse.json({ error: { cnic: ['A client with this CNIC already exists'] } }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: { name, phone, cnic, address },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
