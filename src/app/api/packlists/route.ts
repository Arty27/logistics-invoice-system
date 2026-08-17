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

    const { packlistNumber, invoiceQuantity, grossWeight } = result.data;

    /*
     * Additional pickers are supplied by the UI.
     *
     * The database supports multiple additional pickers,
     * while the UI currently limits this to one.
     */
    const additionalPickerIds: string[] = Array.isArray(
      body.additionalPickerIds,
    )
      ? body.additionalPickerIds
      : [];

    /*
     * Remove duplicates.
     *
     * This also prevents the primary picker from accidentally
     * being included twice if the client sends it as an
     * additional picker.
     */
    const uniqueAdditionalPickerIds = [...new Set(additionalPickerIds)].filter(
      (id) => id !== picker.id,
    );

    /*
     * All pickers participating in this delivery.
     *
     * Sorting is important because every transaction acquires
     * locks in the same order, reducing the possibility of
     * deadlocks when two deliveries involve overlapping pickers.
     */
    const pickerIds = [picker.id, ...uniqueAdditionalPickerIds].sort();
    let additionalPickers: Array<{
      id: string;
      name: string;
      role: 'ADMIN' | 'PICKER';
      phoneNumber: string;
      isActive: boolean;
    }> = [];

    const packlist = await prisma.$transaction(
      async (tx) => {
        /*
         * =========================================================
         * 1. LOCK ALL INVOLVED PICKERS
         * =========================================================
         *
         * PostgreSQL FOR UPDATE locks these User rows until the
         * transaction commits or rolls back.
         *
         * This is the important part that prevents two concurrent
         * requests from both passing the "picker is free" check.
         */
        await tx.$queryRaw(
          Prisma.sql`
            SELECT "id"
            FROM "User"
            WHERE "id" IN (${Prisma.join(pickerIds)})
            FOR UPDATE
          `,
        );

        /*
         * =========================================================
         * 2. VALIDATE ADDITIONAL PICKERS
         * =========================================================
         *
         * The User rows are already locked, so their state cannot
         * change underneath this transaction.
         */

        if (uniqueAdditionalPickerIds.length > 0) {
          additionalPickers = await tx.user.findMany({
            where: {
              id: {
                in: uniqueAdditionalPickerIds,
              },
            },
            select: {
              id: true,
              name: true,
              role: true,
              phoneNumber: true,
              isActive: true,
            },
          });

          /*
           * Make sure every requested picker exists.
           */
          if (additionalPickers.length !== uniqueAdditionalPickerIds.length) {
            throw new Error('ADDITIONAL_PICKER_NOT_FOUND');
          }

          /*
           * Make sure every additional picker is:
           *
           * - a PICKER
           * - active
           */
          const invalidPicker = additionalPickers.find(
            (additionalPicker) =>
              additionalPicker.role !== 'PICKER' || !additionalPicker.isActive,
          );

          if (invalidPicker) {
            throw new Error('ADDITIONAL_PICKER_INVALID');
          }
        }

        /*
         * =========================================================
         * 3. CHECK PRIMARY PICKER
         * =========================================================
         *
         * The primary picker's User row is already locked.
         *
         * Therefore another concurrent delivery cannot get past
         * the same lock until this transaction finishes.
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
         * 4. CHECK ADDITIONAL PICKERS
         * =========================================================
         *
         * Because their User rows are also locked, two concurrent
         * delivery requests cannot both successfully assign the
         * same picker.
         */
        if (uniqueAdditionalPickerIds.length > 0) {
          const busyAdditionalPicker = await tx.packlistPicker.findFirst({
            where: {
              pickerId: {
                in: uniqueAdditionalPickerIds,
              },
              packlist: {
                status: 'ACTIVE',
              },
            },
            select: {
              pickerId: true,
              packlist: {
                select: {
                  packlistNumber: true,
                },
              },
            },
          });

          if (busyAdditionalPicker) {
            throw new Error(
              `ADDITIONAL_PICKER_BUSY:${busyAdditionalPicker.packlist.packlistNumber}`,
            );
          }
        }

        /*
         * =========================================================
         * 5. CREATE PACKLIST
         * =========================================================
         */
        const createdPacklist = await tx.packlistEntry.create({
          data: {
            packlistNumber,
            invoiceQuantity,
            grossWeight,

            /*
             * Legacy compatibility.
             *
             * Keep this populated for the existing application.
             */
            pickerId: picker.id,

            /*
             * New source of truth for who created the delivery.
             */
            createdById: picker.id,

            /*
             * Delivery lifecycle.
             */
            status: 'ACTIVE',
            startedAt: new Date(),
          },
        });

        /*
         * =========================================================
         * 6. CREATE PICKER ASSIGNMENTS
         * =========================================================
         *
         * One createMany call handles:
         *
         * primary picker
         * +
         * all additional pickers
         *
         * The database's unique constraint on
         * (packlistId, pickerId) provides another layer of safety.
         */
        const allPickerIds = [picker.id, ...uniqueAdditionalPickerIds];

        await tx.packlistPicker.createMany({
          data: allPickerIds.map((pickerId) => ({
            packlistId: createdPacklist.id,
            pickerId,
          })),
        });

        /*
         * =========================================================
         * 7. AUDIT LOG
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
              additionalPickerIds: uniqueAdditionalPickerIds,
            },
          },
        });

        return createdPacklist;
      },
      {
        /*
         * We are deliberately using a transaction because the
         * row locks must remain held until all changes are complete.
         */
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    /*
     * ===========================================================
     * 8. RESPONSE
     * ===========================================================
     */
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
              phoneNumber: additionalPicker.phoneNumber,
              role: additionalPicker.role,
            })),
          ],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    /*
     * ===========================================================
     * AUTHENTICATION / AUTHORIZATION
     * ===========================================================
     */
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Only pickers can enter packlists.' },
        { status: 403 },
      );
    }

    /*
     * ===========================================================
     * PRIMARY PICKER BUSY
     * ===========================================================
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
     * ===========================================================
     * ADDITIONAL PICKER NOT FOUND
     * ===========================================================
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
     * ===========================================================
     * ADDITIONAL PICKER INVALID
     * ===========================================================
     */
    if (
      error instanceof Error &&
      error.message === 'ADDITIONAL_PICKER_INVALID'
    ) {
      return NextResponse.json(
        {
          error:
            'One or more selected pickers are inactive or are not valid pickers.',
        },
        { status: 400 },
      );
    }

    /*
     * ===========================================================
     * ADDITIONAL PICKER BUSY
     * ===========================================================
     */
    if (
      error instanceof Error &&
      error.message.startsWith('ADDITIONAL_PICKER_BUSY:')
    ) {
      const packlistNumber = error.message.split(':')[1];

      return NextResponse.json(
        {
          error: `The selected additional picker is already assigned to active delivery ${packlistNumber}.`,
        },
        { status: 409 },
      );
    }

    /*
     * ===========================================================
     * DUPLICATE PACKLIST
     * ===========================================================
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

    console.error('Create packlist error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong.',
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
