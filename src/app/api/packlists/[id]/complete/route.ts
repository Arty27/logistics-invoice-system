import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requirePicker } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const picker = await requirePicker();

    const { id: packlistId } = await context.params;

    /*
     * The picker must be assigned to this delivery.
     */
    const assignment = await prisma.packlistPicker.findUnique({
      where: {
        packlistId_pickerId: {
          packlistId,
          pickerId: picker.id,
        },
      },
      select: {
        packlist: {
          select: {
            id: true,
            referenceNumber: true,
            invoiceQuantity: true,
            grossWeight: true,
            status: true,
            deliveryType: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error: 'You are not assigned to this delivery.',
        },
        { status: 403 },
      );
    }

    const packlist = assignment.packlist;

    /*
     * A delivery can only be completed once.
     */
    if (packlist.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error:
            packlist.status === 'COMPLETED'
              ? 'This delivery has already been completed.'
              : 'This delivery cannot be completed.',
        },
        { status: 409 },
      );
    }

    /*
     * A delivery must have a start time before
     * it can be completed.
     */
    if (!packlist.startedAt) {
      return NextResponse.json(
        {
          error: 'This delivery does not have a valid start time.',
        },
        { status: 409 },
      );
    }

    /*
     * Server-side completion timestamp.
     *
     * This is the source of truth for calculating
     * how long the delivery took.
     */
    const completedAt = new Date();

    /*
     * Update the delivery and create the audit record
     * atomically.
     */
    const completedPacklist = await prisma.$transaction(async (tx) => {
      const updatedPacklist = await tx.packlistEntry.update({
        where: {
          id: packlistId,
        },
        data: {
          status: 'COMPLETED',
          completedAt,
        },
        select: {
          id: true,
          referenceNumber: true,
          invoiceQuantity: true,
          grossWeight: true,
          status: true,
          deliveryType: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,

          /*
           * Fetch all pickers assigned to this delivery.
           */
          pickers: {
            select: {
              picker: {
                select: {
                  id: true,
                  name: true,
                  phoneNumber: true,
                  role: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: picker.id,
          action: 'COMPLETE_PACKLIST',
          entityType: 'PACKLIST',
          entityId: packlistId,
          changes: {
            status: {
              from: 'ACTIVE',
              to: 'COMPLETED',
            },
            completedAt,
          },
        },
      });

      return updatedPacklist;
    });

    /*
     * Convert the Prisma PacklistPicker structure:
     *
     * [
     *   { picker: {...} },
     *   { picker: {...} }
     * ]
     *
     * into the structure expected by the UI:
     *
     * [
     *   {...},
     *   {...}
     * ]
     */
    const pickers = completedPacklist.pickers.map(
      (assignment) => assignment.picker,
    );

    /*
     * Calculate duration in seconds.
     *
     * The server timestamps are used, so the client
     * cannot manipulate the duration.
     */
    const durationSeconds = Math.max(
      0,
      Math.floor(
        (completedPacklist.completedAt!.getTime() -
          completedPacklist.startedAt!.getTime()) /
          1000,
      ),
    );

    return NextResponse.json({
      success: true,

      packlist: {
        id: completedPacklist.id,
        referenceNumber: completedPacklist.referenceNumber,
        invoiceQuantity: completedPacklist.invoiceQuantity,
        grossWeight: completedPacklist.grossWeight.toString(),
        status: completedPacklist.status,
        deliveryType: completedPacklist.deliveryType,
        startedAt: completedPacklist.startedAt,
        completedAt: completedPacklist.completedAt,
        createdAt: completedPacklist.createdAt,

        /*
         * All pickers participating in the delivery.
         */
        pickers,

        /*
         * Total time taken by the delivery in seconds.
         *
         * Example:
         * 2720 seconds = 45 minutes 20 seconds
         */
        durationSeconds,
      },
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
          error: 'Only pickers can complete deliveries.',
        },
        { status: 403 },
      );
    }

    console.error('Complete packlist error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
