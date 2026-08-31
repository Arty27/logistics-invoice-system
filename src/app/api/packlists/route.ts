import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requirePicker, requireUser } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

const packlistSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .min(1, 'Reference number is required.')
    .max(100, 'Reference number is too long.')
    .regex(
      /^[A-Za-z0-9]+$/,
      'Reference number must contain only letters and numbers.',
    ),

  deliveryType: z.enum(['INWARD', 'OUTWARD', 'MATERIAL_RETURN', 'OTHER']),

  invoiceQuantity: z.coerce.number().int().positive(),

  grossWeight: z.coerce.number().positive(),
});

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

const CURRENT_CALCULATION_VERSION = 1;

export async function POST(request: Request) {
  try {
    const picker = await requirePicker();

    const body = await request.json();

    const result = packlistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid delivery data',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { referenceNumber, invoiceQuantity, grossWeight, deliveryType } =
      result.data;

    /*
     * ---------------------------------------------------------
     * COMPANY
     * ---------------------------------------------------------
     *
     * The company is NEVER accepted from the frontend.
     *
     * It comes from the authenticated picker.
     */
    if (!picker.companyId) {
      return NextResponse.json(
        {
          error: 'Your account is not assigned to a company.',
        },
        { status: 403 },
      );
    }

    /*
     * ---------------------------------------------------------
     * ADDITIONAL PICKERS
     * ---------------------------------------------------------
     */

    const additionalPickerIds: string[] = Array.isArray(
      body.additionalPickerIds,
    )
      ? body.additionalPickerIds
      : [];

    /*
     * Remove duplicates and prevent the primary picker from
     * being added again as an additional picker.
     */
    const uniqueAdditionalPickerIds = [...new Set(additionalPickerIds)].filter(
      (id) => id !== picker.id,
    );

    /*
     * All participating picker IDs.
     *
     * Sorting is important because every transaction obtains
     * User row locks in exactly the same order.
     */
    const pickerIds = [picker.id, ...uniqueAdditionalPickerIds].sort();

    let additionalPickers: Array<{
      id: string;
      name: string;
      role: 'ADMIN' | 'SUPERVISOR' | 'PICKER';
      phoneNumber: string;
      isActive: boolean;
      companyId: string | null;
    }> = [];

    const packlist = await prisma.$transaction(
      async (tx) => {
        /*
         * =====================================================
         * 1. LOCK ALL INVOLVED PICKERS
         * =====================================================
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
         * =====================================================
         * 2. VALIDATE ADDITIONAL PICKERS
         * =====================================================
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
              companyId: true,
            },
          });

          /*
           * Every requested picker must exist.
           */
          if (additionalPickers.length !== uniqueAdditionalPickerIds.length) {
            throw new Error('ADDITIONAL_PICKER_NOT_FOUND');
          }

          /*
           * Every additional picker must:
           *
           * - be a PICKER
           * - be active
           * - belong to the same company
           */
          const invalidPicker = additionalPickers.find(
            (additionalPicker) =>
              additionalPicker.role !== 'PICKER' ||
              !additionalPicker.isActive ||
              additionalPicker.companyId !== picker.companyId,
          );

          if (invalidPicker) {
            throw new Error('ADDITIONAL_PICKER_INVALID');
          }
        }

        /*
         * =====================================================
         * 3. CHECK PRIMARY PICKER
         * =====================================================
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
                id: true,
                referenceNumber: true,
              },
            },
          },
        });

        if (primaryActiveDelivery) {
          throw new Error(
            `PRIMARY_PICKER_BUSY:${primaryActiveDelivery.packlist.referenceNumber}`,
          );
        }

        /*
         * =====================================================
         * 4. CHECK ADDITIONAL PICKERS
         * =====================================================
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
                  referenceNumber: true,
                },
              },
            },
          });

          if (busyAdditionalPicker) {
            throw new Error(
              `ADDITIONAL_PICKER_BUSY:${busyAdditionalPicker.packlist.referenceNumber}`,
            );
          }
        }

        /*
         * =====================================================
         * 5. CALCULATE PER-PERSON WEIGHT
         * =====================================================
         *
         * Current version:
         *
         * INWARD:
         *
         * grossWeight / numberOfPickers / 2
         *
         * Example:
         *
         * 150 kg / 3 / 2 = 25 kg
         *
         * For now, only INWARD uses this calculation.
         *
         * Other delivery types store NULL because their
         * calculation rule has not been defined yet.
         */

        const numberOfPickers = 1 + uniqueAdditionalPickerIds.length;

        let perPersonWeight: Prisma.Decimal | null = null;
        let calculationVersion: number | null = null;

        if (deliveryType === 'INWARD') {
          perPersonWeight = new Prisma.Decimal(grossWeight)
            .dividedBy(numberOfPickers)
            .dividedBy(2);

          /*
           * Store the version alongside the calculated value.
           */
          calculationVersion = CURRENT_CALCULATION_VERSION;
        }

        /*
         * =====================================================
         * 6. CREATE DELIVERY
         * =====================================================
         */

        const createdPacklist = await tx.packlistEntry.create({
          data: {
            /*
             * New generic reference.
             */
            referenceNumber,

            invoiceQuantity,
            grossWeight,

            /*
             * Legacy compatibility.
             *
             * New records do not use packlistNumber.
             */
            packlistNumber: null,

            /*
             * Legacy primary picker reference.
             */
            pickerId: picker.id,

            /*
             * Company comes from authenticated user.
             */
            companyId: picker.companyId!,

            /*
             * Creator.
             */
            createdById: picker.id,

            /*
             * Delivery information.
             */
            deliveryType,
            status: 'ACTIVE',
            startedAt: new Date(),

            /*
             * Versioned calculation.
             */
            perPersonWeight,
            calculationVersion,
          },
        });

        /*
         * =====================================================
         * 7. CREATE PICKER ASSIGNMENTS
         * =====================================================
         */

        const allPickerIds = [picker.id, ...uniqueAdditionalPickerIds];

        await tx.packlistPicker.createMany({
          data: allPickerIds.map((pickerId) => ({
            packlistId: createdPacklist.id,
            pickerId,
          })),
        });

        /*
         * =====================================================
         * 8. AUDIT LOG
         * =====================================================
         */

        await tx.auditLog.create({
          data: {
            userId: picker.id,
            action: 'CREATE_PACKLIST',
            entityType: 'PACKLIST',
            entityId: createdPacklist.id,
            changes: {
              referenceNumber,
              invoiceQuantity,
              grossWeight,
              deliveryType,
              companyId: picker.companyId,
              primaryPickerId: picker.id,
              additionalPickerIds: uniqueAdditionalPickerIds,
              perPersonWeight: perPersonWeight?.toString() ?? null,
              calculationVersion,
            },
          },
        });

        return createdPacklist;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    /*
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    return NextResponse.json(
      {
        success: true,
        packlist: {
          id: packlist.id,

          referenceNumber: packlist.referenceNumber,

          invoiceQuantity: packlist.invoiceQuantity,

          grossWeight: packlist.grossWeight.toString(),

          deliveryType: packlist.deliveryType,

          perPersonWeight: packlist.perPersonWeight?.toString() ?? null,

          calculationVersion: packlist.calculationVersion,

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
     * =========================================================
     * AUTHENTICATION
     * =========================================================
     */

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
          error: 'Only pickers can enter deliveries.',
        },
        { status: 403 },
      );
    }

    /*
     * =========================================================
     * PRIMARY PICKER BUSY
     * =========================================================
     */

    if (
      error instanceof Error &&
      error.message.startsWith('PRIMARY_PICKER_BUSY:')
    ) {
      const referenceNumber = error.message.substring(
        'PRIMARY_PICKER_BUSY:'.length,
      );

      return NextResponse.json(
        {
          error: `You already have an active delivery (${referenceNumber}). Complete it before starting another delivery.`,
        },
        { status: 409 },
      );
    }

    /*
     * =========================================================
     * ADDITIONAL PICKER NOT FOUND
     * =========================================================
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
     * =========================================================
     * ADDITIONAL PICKER INVALID
     * =========================================================
     */

    if (
      error instanceof Error &&
      error.message === 'ADDITIONAL_PICKER_INVALID'
    ) {
      return NextResponse.json(
        {
          error:
            'One or more selected pickers are inactive, are not valid pickers, or belong to another company.',
        },
        { status: 400 },
      );
    }

    /*
     * =========================================================
     * ADDITIONAL PICKER BUSY
     * =========================================================
     */

    if (
      error instanceof Error &&
      error.message.startsWith('ADDITIONAL_PICKER_BUSY:')
    ) {
      const referenceNumber = error.message.substring(
        'ADDITIONAL_PICKER_BUSY:'.length,
      );

      return NextResponse.json(
        {
          error: `The selected additional picker is already assigned to active delivery ${referenceNumber}.`,
        },
        { status: 409 },
      );
    }

    /*
     * =========================================================
     * DATABASE ERROR
     * =========================================================
     */

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error: 'This delivery reference already exists.',
        },
        { status: 409 },
      );
    }

    console.error('Create delivery error:', error);

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
        referenceNumber: true,
        deliveryType: true,
        perPersonWeight: true,
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
        referenceNumber: packlist.referenceNumber,
        deliveryType: packlist.deliveryType,
        grossWeight: packlist.grossWeight.toString(),
        perPersonWeight: packlist.perPersonWeight,
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
