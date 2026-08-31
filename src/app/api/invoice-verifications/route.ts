import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireUser } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

export async function GET() {
  try {
    const supervisor = await requireUser();

    if (supervisor.role !== 'SUPERVISOR') {
      throw new ForbiddenError();
    }

    if (!supervisor.companyId) {
      return NextResponse.json(
        {
          error: 'Your account is not assigned to a company.',
        },
        { status: 400 },
      );
    }

    const verifications = await prisma.invoiceVerification.findMany({
      where: {
        supervisorId: supervisor.id,
        status: 'COMPLETED',
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
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      data: verifications.map((verification) => ({
        id: verification.id,
        invoiceNumber: verification.invoiceNumber,

        invoicedQuantity: verification.invoicedQuantity,
        invoicedWeight: verification.invoicedWeight.toString(),

        dispatchedQuantity: verification.dispatchedQuantity,

        dispatchedWeight: verification.dispatchedWeight?.toString() ?? null,

        remarks: verification.remarks,
        result: verification.result,
        status: verification.status,

        startedAt: verification.startedAt,
        completedAt: verification.completedAt,
        createdAt: verification.createdAt,
      })),

      count: verifications.length,
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
          error: 'Only supervisors can access verification history.',
        },
        { status: 403 },
      );
    }

    console.error('Get invoice verification history error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
