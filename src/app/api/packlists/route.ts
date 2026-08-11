import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import {
  requirePicker,
  requireAdmin,
  requireUser,
} from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

const packlistSchema = z.object({
  packlistNumber: z
    .string()
    .min(1, 'Packlist number is required')
    .regex(
      /^[A-Za-z0-9]{8}$/,
      'Packlist number must contain exactly 8 characters',
    ),

  invoiceQuantity: z
    .union([z.string(), z.number()])
    .transform((value) => (value === '' ? NaN : Number(value)))
    .pipe(
      z
        .number({
          message: 'Invoice quantity is required',
        })
        .int('Invoice quantity must be a whole number')
        .positive('Invoice quantity must be greater than zero'),
    ),

  grossWeight: z
    .string()
    .min(1, 'Gross weight is required')
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'Gross weight must have at most 2 decimal places',
    )
    .refine((value) => Number(value) > 0, {
      message: 'Gross weight must be greater than zero',
    }),
});

export async function POST(request: Request) {
  try {
    const picker = await requirePicker();

    const body = await request.json();

    const result = packlistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid packlist data',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { packlistNumber, invoiceQuantity, grossWeight } = result.data;

    const packlist = await prisma.packlistEntry.create({
      data: {
        packlistNumber,
        invoiceQuantity,
        grossWeight,
        pickerId: picker.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        packlist: {
          id: packlist.id,
          packlistNumber: packlist.packlistNumber,
          invoiceQuantity: packlist.invoiceQuantity,
          grossWeight: packlist.grossWeight.toString(),
          createdAt: packlist.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Only pickers can enter packlists' },
        { status: 403 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'This packlist number has already been entered.' },
        { status: 409 },
      );
    }

    console.error('Create packlist error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.PacklistEntryWhereInput = {};

    // Pickers can only ever see their own records.
    if (user.role === 'PICKER') {
      where.pickerId = user.id;
    }

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            error: 'Both startDate and endDate are required.',
          },
          { status: 400 },
        );
      }

      const startDateResult = dateSchema.safeParse(startDate);
      const endDateResult = dateSchema.safeParse(endDate);

      if (!startDateResult.success || !endDateResult.success) {
        return NextResponse.json(
          {
            error: 'Dates must be in YYYY-MM-DD format.',
          },
          { status: 400 },
        );
      }

      const start = new Date(`${startDate}T00:00:00+05:30`);
      const end = new Date(`${endDate}T00:00:00+05:30`);

      if (end < start) {
        return NextResponse.json(
          {
            error: 'End date cannot be before start date.',
          },
          { status: 400 },
        );
      }

      end.setDate(end.getDate() + 1);

      where.createdAt = {
        gte: start,
        lt: end,
      };
    }

    const packlists = await prisma.packlistEntry.findMany({
      where,
      select: {
        id: true,
        packlistNumber: true,
        invoiceQuantity: true,
        grossWeight: true,
        createdAt: true,
        picker: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      data: packlists.map((packlist) => ({
        id: packlist.id,
        packlistNumber: packlist.packlistNumber,
        invoiceQuantity: packlist.invoiceQuantity,
        grossWeight: packlist.grossWeight.toString(),
        createdAt: packlist.createdAt,
        picker: packlist.picker,
      })),
      count: packlists.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    console.error('Get packlists error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
