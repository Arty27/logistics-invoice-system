import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireSupervisor } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

function getIndiaDateRange(date: string) {
  const start = new Date(`${date}T00:00:00+05:30`);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireSupervisor();

    const { searchParams } = new URL(request.url);

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let start: Date;
    let end: Date;

    /*
     * =========================================================
     * 1. No dates supplied
     *
     * Default to today's date in India.
     * =========================================================
     */
    if (!startDateParam && !endDateParam) {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const todayRange = getIndiaDateRange(today);

      start = todayRange.start;
      end = todayRange.end;
    } else {
      /*
       * =======================================================
       * 2. Explicit date range supplied
       * =======================================================
       */

      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          {
            error: 'Both startDate and endDate are required.',
          },
          { status: 400 },
        );
      }

      const startDateResult = dateSchema.safeParse(startDateParam);
      const endDateResult = dateSchema.safeParse(endDateParam);

      if (!startDateResult.success || !endDateResult.success) {
        return NextResponse.json(
          {
            error: 'Dates must be in YYYY-MM-DD format.',
          },
          { status: 400 },
        );
      }

      /*
       * Validate that the end date isn't before the start date.
       */
      if (endDateParam < startDateParam) {
        return NextResponse.json(
          {
            error: 'End date cannot be before start date.',
          },
          { status: 400 },
        );
      }

      /*
       * Start of the selected start date.
       */
      const startRange = getIndiaDateRange(startDateParam);

      /*
       * Start of the day AFTER the selected end date.
       *
       * For example:
       *
       * startDate = 2026-08-10
       * endDate   = 2026-08-17
       *
       * Query becomes:
       *
       * >= Aug 10 00:00 IST
       * <  Aug 18 00:00 IST
       */
      const endRange = getIndiaDateRange(endDateParam);

      start = startRange.start;
      end = endRange.end;
    }

    /*
     * =========================================================
     * 3. Query RST entries
     * =========================================================
     */

    const entries = await prisma.rstEntry.findMany({
      where: {
        enteredAt: {
          gte: start,
          lt: end,
        },
        companyId: user.companyId!,
      },

      select: {
        id: true,
        skuCode: true,
        quantity: true,
        enteredAt: true,

        enteredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        enteredAt: 'desc',
      },
    });

    /*
     * =========================================================
     * 4. Return response
     * =========================================================
     */

    return NextResponse.json({
      data: entries.map((entry) => ({
        id: entry.id,
        skuCode: entry.skuCode,
        quantity: entry.quantity,
        enteredAt: entry.enteredAt,
        enteredBy: entry.enteredBy,
      })),

      count: entries.length,

      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        {
          error: 'Authentication required.',
        },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        {
          error: 'Admin access required.',
        },
        { status: 403 },
      );
    }

    console.error('Get RST entries error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supervisor = await requireSupervisor();

    const body = await request.json();

    const skuCode =
      typeof body.skuCode === 'string' ? body.skuCode.trim().toUpperCase() : '';

    const quantity = Number(body.quantity);

    if (!skuCode) {
      return NextResponse.json(
        { error: 'SKU code is required.' },
        { status: 400 },
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: 'Quantity must be a positive whole number.',
        },
        { status: 400 },
      );
    }

    const rstEntry = await prisma.rstEntry.create({
      data: {
        skuCode,
        quantity,
        enteredById: supervisor.id,
        companyId: supervisor.companyId!,
      },

      select: {
        id: true,
        skuCode: true,
        quantity: true,
        enteredAt: true,

        enteredBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: rstEntry,
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
        { error: 'Admin access required.' },
        { status: 403 },
      );
    }

    console.error('Create RST entry error:', error);

    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 },
    );
  }
}
