import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requirePicker } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

const packlistSchema = z.object({
  packlistNumber: z
    .string()
    .min(1, 'Packlist number is required')
    .regex(/^\d{8}$/, 'Packlist number must contain exactly 8 digits'),

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
