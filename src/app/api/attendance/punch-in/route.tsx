import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requirePicker } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';
import { getIndianDayRange } from '@/server/common/date';

export async function POST() {
  try {
    const picker = await requirePicker();

    const { start } = getIndianDayRange();
    const now = new Date();

    const attendance = await prisma.attendance.create({
      data: {
        userId: picker.id,
        attendanceDate: start,
        punchedInAt: now,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: attendance.id,
          attendanceDate: attendance.attendanceDate,
          punchedInAt: attendance.punchedInAt,
          punchedOutAt: attendance.punchedOutAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Only pickers can punch attendance.' },
        { status: 403 },
      );
    }

    /*
     * The database unique constraint protects us from
     * simultaneous/double Punch In requests.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'You have already punched in today.' },
        { status: 409 },
      );
    }

    console.error('Punch in error:', error);

    return NextResponse.json({ error: 'Unable to punch in.' }, { status: 500 });
  }
}
