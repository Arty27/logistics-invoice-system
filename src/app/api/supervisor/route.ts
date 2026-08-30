import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

export async function GET() {
  try {
    /*
     * ---------------------------------------------------------
     * Authentication
     * ---------------------------------------------------------
     */

    await requireAdmin();

    /*
     * ---------------------------------------------------------
     * Get supervisors
     * ---------------------------------------------------------
     *
     * We only need active supervisors for the admin's
     * supervisor selection dropdown.
     */

    const supervisors = await prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        phoneNumber: true,

        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      data: supervisors,
      count: supervisors.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          error: 'Admin access required',
        },
        { status: 403 },
      );
    }

    console.error('Get supervisors error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
