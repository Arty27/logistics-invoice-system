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
     * The picker must be assigned to this packlist.
     *
     * We deliberately use PacklistPicker rather than the
     * legacy PacklistEntry.pickerId relationship.
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
            packlistNumber: true,
            invoiceQuantity: true,
            grossWeight: true,
            status: true,
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
          packlistNumber: true,
          invoiceQuantity: true,
          grossWeight: true,
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
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

    return NextResponse.json({
      success: true,
      packlist: {
        id: completedPacklist.id,
        packlistNumber: completedPacklist.packlistNumber,
        invoiceQuantity: completedPacklist.invoiceQuantity,
        grossWeight: completedPacklist.grossWeight.toString(),
        status: completedPacklist.status,
        startedAt: completedPacklist.startedAt,
        completedAt: completedPacklist.completedAt,
        createdAt: completedPacklist.createdAt,
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
