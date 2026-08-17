import { NextResponse } from 'next/server';

import { requirePicker } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';
import { getIndianDayRange } from '@/server/common/date';

export async function GET() {
  try {
    const picker = await requirePicker();

    const { start } = getIndianDayRange();

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId: picker.id,
          attendanceDate: start,
        },
      },
      select: {
        id: true,
        attendanceDate: true,
        punchedInAt: true,
        punchedOutAt: true,
      },
    });

    return NextResponse.json({
      data: attendance,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Only pickers can view attendance.' },
        { status: 403 },
      );
    }

    console.error('Get current attendance error:', error);

    return NextResponse.json(
      { error: 'Unable to load attendance.' },
      { status: 500 },
    );
  }
}
