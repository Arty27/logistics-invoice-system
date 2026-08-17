import { NextResponse } from 'next/server';

import { requirePicker } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';
import { getIndianDayRange } from '@/server/common/date';

export async function POST() {
  try {
    const picker = await requirePicker();

    const { start, end } = getIndianDayRange();

    const now = new Date();

    /*
     * Find today's attendance record.
     */
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_attendanceDate: {
          userId: picker.id,
          attendanceDate: start,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          error: 'You have not punched in today.',
        },
        { status: 409 },
      );
    }

    if (attendance.punchedOutAt) {
      return NextResponse.json(
        {
          error: 'You have already punched out today.',
        },
        { status: 409 },
      );
    }

    /*
     * Ensure the current time belongs to today's
     * Indian business day.
     */
    if (now < start || now >= end) {
      return NextResponse.json(
        {
          error: 'Attendance is outside the current business day.',
        },
        { status: 400 },
      );
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        punchedOutAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAttendance.id,
        attendanceDate: updatedAttendance.attendanceDate,
        punchedInAt: updatedAttendance.punchedInAt,
        punchedOutAt: updatedAttendance.punchedOutAt,
      },
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
        { error: 'Only pickers can punch attendance.' },
        { status: 403 },
      );
    }

    console.error('Punch out error:', error);

    return NextResponse.json(
      { error: 'Unable to punch out.' },
      { status: 500 },
    );
  }
}
