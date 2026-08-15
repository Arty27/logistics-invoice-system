import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requirePicker, requireUser } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

const packlistSchema = z.object({
  packlistNumber: z
    .string()
    .min(1, 'Packlist number is required')
    .regex(
      /^[A-Za-z0-9]{8}$/,
      'Packlist number must contain exactly 8 alphanumeric characters',
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

  /*
   * API supports multiple additional pickers.
   *
   * The UI currently limits this to one additional picker.
   */
  additionalPickerIds: z
    .array(z.uuid('Invalid picker ID'))
    .optional()
    .default([]),
});

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

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

    const {
      packlistNumber,
      invoiceQuantity,
      grossWeight,
      additionalPickerIds,
    } = result.data;

    /*
     * The authenticated picker cannot also be an additional picker.
     */
    if (additionalPickerIds.includes(picker.id)) {
      return NextResponse.json(
        {
          error: 'You cannot add yourself as an additional picker.',
        },
        { status: 400 },
      );
    }

    /*
     * Prevent duplicate picker IDs in the request.
     */
    if (new Set(additionalPickerIds).size !== additionalPickerIds.length) {
      return NextResponse.json(
        {
          error: 'The same picker cannot be added more than once.',
        },
        { status: 400 },
      );
    }
    let additionalPickers: Array<{
      id: string;
      name: string;
      role: 'ADMIN' | 'PICKER';
      isActive: boolean;
      packlistAssignments: Array<{
        packlist: {
          id: string;
          packlistNumber: string;
        };
      }>;
    }> = [];

    const packlist = await prisma.$transaction(async (tx) => {
      /*
       * =========================================================
       * 1. Validate all additional pickers.
       *
       * One query checks:
       *
       * - picker exists
       * - picker is active
       * - picker has PICKER role
       * - picker currently has an ACTIVE delivery
       *
       * We don't need to query the primary picker because
       * requirePicker() has already authenticated it.
       * =========================================================
       */

      if (additionalPickerIds.length > 0) {
        additionalPickers = await tx.user.findMany({
          where: {
            id: {
              in: additionalPickerIds,
            },
          },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            role: true,
            isActive: true,

            packlistAssignments: {
              where: {
                packlist: {
                  status: 'ACTIVE',
                },
              },
              select: {
                packlist: {
                  select: {
                    id: true,
                    packlistNumber: true,
                  },
                },
              },
            },
          },
        });

        /*
         * Check that every requested picker exists.
         */
        if (additionalPickers.length !== additionalPickerIds.length) {
          throw new Error('ADDITIONAL_PICKER_NOT_FOUND');
        }

        /*
         * Check that all requested users are valid active pickers.
         */
        const invalidPicker = additionalPickers.find(
          (additionalPicker) =>
            additionalPicker.role !== 'PICKER' || !additionalPicker.isActive,
        );

        if (invalidPicker) {
          throw new Error('ADDITIONAL_PICKER_INVALID');
        }

        /*
         * Check whether any additional picker already has
         * an active delivery.
         */
        const busyAdditionalPicker = additionalPickers.find(
          (additionalPicker) => additionalPicker.packlistAssignments.length > 0,
        );

        if (busyAdditionalPicker) {
          const activeDelivery = busyAdditionalPicker.packlistAssignments[0];

          throw new Error(
            `ADDITIONAL_PICKER_BUSY:${activeDelivery.packlist.packlistNumber}`,
          );
        }
      }

      /*
       * =========================================================
       * 2. Check whether the primary picker already has an
       *    active delivery.
       *
       * This is separate from the additional-picker query because
       * requirePicker() gives us the authenticated primary user,
       * but we still need to check their current assignment.
       * =========================================================
       */

      const primaryActiveDelivery = await tx.packlistPicker.findFirst({
        where: {
          pickerId: picker.id,
          packlist: {
            status: 'ACTIVE',
          },
        },
        select: {
          packlist: {
            select: {
              packlistNumber: true,
            },
          },
        },
      });

      if (primaryActiveDelivery) {
        throw new Error(
          `PRIMARY_PICKER_BUSY:${primaryActiveDelivery.packlist.packlistNumber}`,
        );
      }

      /*
       * =========================================================
       * 3. Create PacklistEntry.
       *
       * pickerId is retained temporarily for backward
       * compatibility with the existing application.
       *
       * createdById is the new source of truth.
       * =========================================================
       */

      const createdPacklist = await tx.packlistEntry.create({
        data: {
          packlistNumber,
          invoiceQuantity,
          grossWeight,

          // Legacy compatibility
          pickerId: picker.id,

          // New primary picker
          createdById: picker.id,

          // Delivery lifecycle
          status: 'ACTIVE',
          startedAt: new Date(),
        },
      });

      /*
       * =========================================================
       * 4. Add primary picker and additional pickers if any
       * =========================================================
       */

      const pickerIds = [picker.id, ...additionalPickerIds];

      await tx.packlistPicker.createMany({
        data: pickerIds.map((pickerId) => ({
          packlistId: createdPacklist.id,
          pickerId,
        })),
      });

      /*
       * =========================================================
       * 6. Create audit record.
       * =========================================================
       */

      await tx.auditLog.create({
        data: {
          userId: picker.id,
          action: 'CREATE_PACKLIST',
          entityType: 'PACKLIST',
          entityId: createdPacklist.id,
          changes: {
            packlistNumber,
            invoiceQuantity,
            grossWeight,
            primaryPickerId: picker.id,
            additionalPickerIds,
          },
        },
      });

      return createdPacklist;
    });

    return NextResponse.json(
      {
        success: true,
        packlist: {
          id: packlist.id,
          packlistNumber: packlist.packlistNumber,
          invoiceQuantity: packlist.invoiceQuantity,
          grossWeight: packlist.grossWeight.toString(),
          status: packlist.status,
          startedAt: packlist.startedAt,
          completedAt: packlist.completedAt,
          createdAt: packlist.createdAt,
          pickers: [
            {
              id: picker.id,
              name: picker.name,
              phoneNumber: picker.phoneNumber,
              role: picker.role,
            },
            ...additionalPickers.map((additionalPicker) => ({
              id: additionalPicker.id,
              name: additionalPicker.name,
              phoneNumber: undefined,
              role: additionalPicker.role,
            })),
          ],
        },
      },
      { status: 201 },
    );
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
          error: 'Only pickers can enter packlists',
        },
        { status: 403 },
      );
    }

    /*
     * Duplicate packlist number.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error: 'This packlist number has already been entered.',
        },
        { status: 409 },
      );
    }

    /*
     * Primary picker is already handling a delivery.
     */
    if (
      error instanceof Error &&
      error.message.startsWith('PRIMARY_PICKER_BUSY:')
    ) {
      const packlistNumber = error.message.split(':')[1];

      return NextResponse.json(
        {
          error: `You already have an active delivery (${packlistNumber}). Complete it before starting another delivery.`,
        },
        { status: 409 },
      );
    }

    /*
     * Additional picker is already handling a delivery.
     */
    if (
      error instanceof Error &&
      error.message.startsWith('ADDITIONAL_PICKER_BUSY:')
    ) {
      const packlistNumber = error.message.split(':')[1];

      return NextResponse.json(
        {
          error: `One of the selected pickers is already assigned to an active delivery (${packlistNumber}).`,
        },
        { status: 409 },
      );
    }

    /*
     * Additional picker doesn't exist.
     */
    if (
      error instanceof Error &&
      error.message === 'ADDITIONAL_PICKER_NOT_FOUND'
    ) {
      return NextResponse.json(
        {
          error: 'One or more selected pickers could not be found.',
        },
        { status: 400 },
      );
    }

    /*
     * Additional picker exists but is not an active picker.
     */
    if (
      error instanceof Error &&
      error.message === 'ADDITIONAL_PICKER_INVALID'
    ) {
      return NextResponse.json(
        {
          error: 'One or more selected pickers are inactive or invalid.',
        },
        { status: 400 },
      );
    }

    console.error('Create packlist error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Prisma.PacklistEntryWhereInput = {};

    /*
     * Pickers see deliveries they are assigned to.
     *
     * This uses PacklistPicker rather than the legacy pickerId.
     */
    if (user.role === 'PICKER') {
      where.pickers = {
        some: {
          pickerId: user.id,
        },
      };
    }

    /*
     * Date filtering.
     */
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
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,

        pickers: {
          select: {
            picker: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
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
        status: packlist.status,
        startedAt: packlist.startedAt,
        completedAt: packlist.completedAt,
        createdAt: packlist.createdAt,
        pickers: packlist.pickers.map((assignment) => assignment.picker),
      })),
      count: packlists.length,
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

    console.error('Get packlists error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
