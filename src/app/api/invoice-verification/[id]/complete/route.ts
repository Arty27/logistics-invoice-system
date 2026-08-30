import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireUser } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const completeVerificationSchema = z.object({
  dispatchedQuantity: z
    .number()
    .int('Dispatched quantity must be a whole number')
    .positive('Dispatched quantity must be greater than zero'),

  dispatchedWeight: z
    .number()
    .positive('Dispatched weight must be greater than zero'),

  remarks: z
    .string()
    .trim()
    .min(1, 'Remarks are required')
    .max(1000, 'Remarks are too long'),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    /*
     * ---------------------------------------------------------
     * Authentication
     * ---------------------------------------------------------
     */

    const supervisor = await requireUser();

    /*
     * Only supervisors can complete invoice verifications.
     */
    if (supervisor.role !== 'SUPERVISOR') {
      throw new ForbiddenError();
    }

    /*
     * A supervisor must belong to a company.
     */
    if (!supervisor.companyId) {
      return NextResponse.json(
        {
          error: 'Your account is not assigned to a company.',
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Get verification ID
     * ---------------------------------------------------------
     */

    const { id: verificationId } = await context.params;

    /*
     * ---------------------------------------------------------
     * Validate request body
     * ---------------------------------------------------------
     */

    const body = await request.json();

    const validation = completeVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { dispatchedQuantity, dispatchedWeight, remarks } = validation.data;

    /*
     * ---------------------------------------------------------
     * Get the active verification
     *
     * We verify BOTH supervisorId and companyId so that a
     * supervisor can only complete their own company's
     * verification.
     * ---------------------------------------------------------
     */

    const verification = await prisma.invoiceVerification.findFirst({
      where: {
        id: verificationId,
        supervisorId: supervisor.id,
        companyId: supervisor.companyId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoicedQuantity: true,
        invoicedWeight: true,
        status: true,
        startedAt: true,
        supervisorId: true,
        companyId: true,
        createdAt: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          error: 'Invoice verification not found.',
        },
        { status: 404 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Verification must still be ACTIVE
     * ---------------------------------------------------------
     */

    if (verification.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error:
            verification.status === 'COMPLETED'
              ? 'This invoice verification has already been completed.'
              : 'This invoice verification cannot be completed.',
        },
        { status: 409 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Business validation
     *
     * Dispatched quantity cannot be greater than invoiced
     * quantity.
     *
     * This rule intentionally lives at API level and not
     * in the database.
     * ---------------------------------------------------------
     */

    if (dispatchedQuantity > verification.invoicedQuantity) {
      return NextResponse.json(
        {
          error:
            'Dispatched quantity cannot be greater than invoiced quantity.',
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Completion timestamp
     *
     * Server time is the source of truth.
     * ---------------------------------------------------------
     */

    const completedAt = new Date();

    /*
     * ---------------------------------------------------------
     * Calculate result
     *
     * For now:
     *
     * MATCHED       → quantity and weight match
     * DISCREPANCY   → quantity or weight differs
     *
     * Remarks are still mandatory regardless of result.
     * ---------------------------------------------------------
     */

    const result =
      dispatchedQuantity === verification.invoicedQuantity &&
      new Prisma.Decimal(dispatchedWeight).equals(verification.invoicedWeight)
        ? 'MATCHED'
        : 'DISCREPANCY';

    /*
     * ---------------------------------------------------------
     * Complete verification atomically
     * ---------------------------------------------------------
     */

    const completedVerification = await prisma.$transaction(async (tx) => {
      const updatedVerification = await tx.invoiceVerification.update({
        where: {
          id: verificationId,
        },
        data: {
          dispatchedQuantity,
          dispatchedWeight: new Prisma.Decimal(dispatchedWeight),
          remarks,
          result,
          status: 'COMPLETED',
          completedAt,
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoicedQuantity: true,
          invoicedWeight: true,
          dispatchedQuantity: true,
          dispatchedWeight: true,
          remarks: true,
          result: true,
          status: true,
          startedAt: true,
          completedAt: true,
          supervisorId: true,
          companyId: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: supervisor.id,
          action: 'COMPLETE_INVOICE_VERIFICATION',
          entityType: 'INVOICE_VERIFICATION',
          entityId: verificationId,
          changes: {
            status: {
              from: 'ACTIVE',
              to: 'COMPLETED',
            },
            dispatchedQuantity,
            dispatchedWeight,
            remarks,
            result,
            completedAt,
          },
        },
      });

      return updatedVerification;
    });

    /*
     * ---------------------------------------------------------
     * Return completed verification
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      verification: {
        id: completedVerification.id,
        invoiceNumber: completedVerification.invoiceNumber,

        invoicedQuantity: completedVerification.invoicedQuantity,

        invoicedWeight: completedVerification.invoicedWeight.toString(),

        dispatchedQuantity: completedVerification.dispatchedQuantity,

        dispatchedWeight:
          completedVerification.dispatchedWeight?.toString() ?? null,

        remarks: completedVerification.remarks,

        result: completedVerification.result,

        status: completedVerification.status,

        startedAt: completedVerification.startedAt,

        completedAt: completedVerification.completedAt,

        supervisorId: completedVerification.supervisorId,

        companyId: completedVerification.companyId,

        createdAt: completedVerification.createdAt,
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
          error: 'Only supervisors can complete invoice verifications.',
        },
        { status: 403 },
      );
    }

    console.error('Complete invoice verification error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
