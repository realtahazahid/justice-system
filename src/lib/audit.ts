import { prisma } from './db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

/**
 * Log an audit history event for a legal case.
 * Resolves the logged-in user from NextAuth session if userId is not explicitly provided.
 */
export async function logCaseAction(
  caseId: string,
  action: string,
  description: string,
  userId?: string
) {
  try {
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const session = await getServerSession(authOptions);
      if (session?.user && (session.user as any).id) {
        resolvedUserId = (session.user as any).id;
      }
    }

    if (!resolvedUserId) {
      // Fallback: use first user or system user for system-level actions
      const systemUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      resolvedUserId = systemUser?.id;
    }

    if (!resolvedUserId) {
      console.error(`Audit log failed: No user found to associate with case action "${action}"`);
      return null;
    }

    return await prisma.caseHistory.create({
      data: {
        caseId,
        userId: resolvedUserId,
        action,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to write audit history record:', error);
    return null;
  }
}
