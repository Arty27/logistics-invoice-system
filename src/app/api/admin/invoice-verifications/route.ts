import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

export async function GET(request: Request) {
  try {
    /*
     * ---------------------------------------------------------
     * Authentication
     * ---------------------------------------------------------
     */
    console.time('admin-auth');
    await requireAdmin();
    console.timeEnd('admin-auth');
    /*
     * ---------------------------------------------------------
     * Read query parameters
     * ---------------------------------------------------------
     */

    const { searchParams } = new URL(request.url);

    const supervisorId = searchParams.get('supervisorId');
    const companyId = searchParams.get('companyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    /*
     * ---------------------------------------------------------
     * Validate dates
     * ---------------------------------------------------------
     */

    if (!from || !to) {
      return NextResponse.json(
        {
          error: 'Both from and to dates are required.',
        },
        { status: 400 },
      );
    }

    /*
     * Since the UI sends YYYY-MM-DD, explicitly construct
     * the beginning and end of the selected dates.
     *
     * We use local date boundaries here rather than relying
     * on the browser to send timestamps.
     */

    const fromDate = new Date(`${from}T00:00:00.000`);
    const toDate = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date range.',
        },
        { status: 400 },
      );
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        {
          error: 'The from date cannot be after the to date.',
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Build query
     * ---------------------------------------------------------
     */
    console.time('verification');
    const verifications = await prisma.invoiceVerification.findMany({
      where: {
        status: 'COMPLETED',

        completedAt: {
          gte: fromDate,
          lte: toDate,
        },

        /*
         * If a specific supervisor was selected, filter by them.
         *
         * If supervisorId is "all" or omitted, no supervisor
         * filter is applied.
         */
        ...(supervisorId && supervisorId !== 'all'
          ? {
              supervisorId,
            }
          : {}),
        ...(companyId && companyId !== 'all'
          ? {
              companyId,
            }
          : {}),
      },

      select: {
        id: true,

        invoiceNumber: true,

        invoicedQuantity: true,
        dispatchedQuantity: true,

        invoicedWeight: true,
        dispatchedWeight: true,

        remarks: true,
        result: true,

        status: true,

        startedAt: true,
        completedAt: true,

        createdAt: true,

        supervisor: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },

        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        completedAt: 'desc',
      },
    });
    console.timeEnd('verification');
    /*
     * ---------------------------------------------------------
     * Return records
     * ---------------------------------------------------------
     */
    console.time('invoice-mapping');
    const data = verifications.map((verification) => ({
      id: verification.id,

      invoiceNumber: verification.invoiceNumber,

      invoicedQuantity: verification.invoicedQuantity,
      dispatchedQuantity: verification.dispatchedQuantity,

      invoicedWeight: verification.invoicedWeight.toString(),
      dispatchedWeight: verification.dispatchedWeight?.toString() ?? null,

      remarks: verification.remarks,
      result: verification.result,

      status: verification.status,

      startedAt: verification.startedAt,
      completedAt: verification.completedAt,

      createdAt: verification.createdAt,

      supervisor: verification.supervisor,

      company: verification.company,
    }));
    console.timeEnd('invoice-mapping');

    return NextResponse.json({
      data: data,

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
          error: 'Admin access required',
        },
        { status: 403 },
      );
    }

    console.error('Get admin invoice verifications error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
