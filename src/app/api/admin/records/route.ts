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

    await requireAdmin();

    /*
     * ---------------------------------------------------------
     * Read query parameters
     * ---------------------------------------------------------
     */

    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
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

    const fromDate = new Date(`${from}T00:00:00.000`);
    const toDateExclusive = new Date(`${to}T00:00:00.000`);

    /*
     * Move the upper boundary to the beginning of the
     * following day.
     *
     * This gives us:
     *
     * >= fromDate
     * < toDateExclusive
     *
     * and avoids relying on 23:59:59.999.
     */
    toDateExclusive.setDate(toDateExclusive.getDate() + 1);

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDateExclusive.getTime())
    ) {
      return NextResponse.json(
        {
          error: 'Invalid date range.',
        },
        { status: 400 },
      );
    }

    if (fromDate >= toDateExclusive) {
      return NextResponse.json(
        {
          error: 'The from date cannot be after the to date.',
        },
        { status: 400 },
      );
    }

    /*
     * ---------------------------------------------------------
     * Build common filters
     * ---------------------------------------------------------
     *
     * companyId applies directly to both tables.
     *
     * userId is interpreted differently:
     *
     * PacklistEntry
     *   -> pickerId
     *
     * InvoiceVerification
     *   -> supervisorId
     */

    const companyFilter =
      companyId && companyId !== 'all'
        ? {
            companyId,
          }
        : {};

    /*
     * ---------------------------------------------------------
     * Fetch Packlists
     * ---------------------------------------------------------
     *
     * Only completed deliveries are included.
     */

    const packlistsPromise = prisma.packlistEntry.findMany({
      where: {
        status: 'COMPLETED',

        completedAt: {
          gte: fromDate,
          lt: toDateExclusive,
        },

        ...companyFilter,

        ...(userId && userId !== 'all'
          ? {
              pickerId: userId,
            }
          : {}),
      },

      select: {
        id: true,

        referenceNumber: true,
        packlistNumber: true,

        invoiceQuantity: true,
        grossWeight: true,

        status: true,
        deliveryType: true,

        startedAt: true,
        completedAt: true,

        createdAt: true,

        picker: {
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
    });

    /*
     * ---------------------------------------------------------
     * Fetch Invoice Verifications
     * ---------------------------------------------------------
     *
     * Only completed verifications are included.
     */

    const invoiceVerificationsPromise = prisma.invoiceVerification.findMany({
      where: {
        status: 'COMPLETED',

        completedAt: {
          gte: fromDate,
          lt: toDateExclusive,
        },

        ...companyFilter,

        ...(userId && userId !== 'all'
          ? {
              supervisorId: userId,
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
    });

    /*
     * ---------------------------------------------------------
     * Run both database queries
     * ---------------------------------------------------------
     *
     * Promise.all means the two queries can execute in
     * parallel rather than waiting for one to finish before
     * starting the other.
     */

    const [packlists, invoiceVerifications] = await Promise.all([
      packlistsPromise,
      invoiceVerificationsPromise,
    ]);

    /*
     * ---------------------------------------------------------
     * Normalize Packlists
     * ---------------------------------------------------------
     */

    const packlistRecords = packlists.map((packlist) => ({
      type: 'PACKLIST' as const,

      id: packlist.id,

      referenceNumber:
        packlist.referenceNumber || packlist.packlistNumber || '',

      company: packlist.company,

      user: packlist.picker,

      invoiceQuantity: packlist.invoiceQuantity,

      grossWeight: packlist.grossWeight.toString(),

      dispatchedQuantity: null,

      dispatchedWeight: null,

      remarks: null,

      result: null,

      status: packlist.status,

      deliveryType: packlist.deliveryType,

      startedAt: packlist.startedAt,

      completedAt: packlist.completedAt,

      createdAt: packlist.createdAt,
    }));

    /*
     * ---------------------------------------------------------
     * Normalize Invoice Verifications
     * ---------------------------------------------------------
     */

    const invoiceRecords = invoiceVerifications.map((verification) => ({
      type: 'INVOICE_VERIFICATION' as const,

      id: verification.id,

      referenceNumber: verification.invoiceNumber,

      company: verification.company,

      user: verification.supervisor,

      invoiceQuantity: verification.invoicedQuantity,

      grossWeight: verification.invoicedWeight.toString(),

      dispatchedQuantity: verification.dispatchedQuantity,

      dispatchedWeight: verification.dispatchedWeight?.toString() ?? null,

      remarks: verification.remarks,

      result: verification.result,

      status: verification.status,

      deliveryType: null,

      startedAt: verification.startedAt,

      completedAt: verification.completedAt,

      createdAt: verification.createdAt,
    }));

    /*
     * ---------------------------------------------------------
     * Combine both record types
     * ---------------------------------------------------------
     */

    const records = [...packlistRecords, ...invoiceRecords];

    /*
     * ---------------------------------------------------------
     * Sort combined records
     * ---------------------------------------------------------
     *
     * Newest completed record first.
     */

    records.sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime(),
    );

    /*
     * ---------------------------------------------------------
     * Return records
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
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

    console.error('Get admin records error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
