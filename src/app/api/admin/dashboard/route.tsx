import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const [
      activePickerCount,
      busyPickerCount,
      todayPacklistStats,
      activeDeliveries,
      recentPacklists,
    ] = await Promise.all([
      /*
       * Total active picker accounts.
       */
      prisma.user.count({
        where: {
          role: 'PICKER',
          isActive: true,
        },
      }),

      /*
       * Pickers currently assigned to an ACTIVE delivery.
       *
       * distinct prevents a picker from being counted twice
       * if the data ever contains multiple assignments.
       */
      prisma.packlistPicker.findMany({
        where: {
          picker: {
            role: 'PICKER',
            isActive: true,
          },
          packlist: {
            status: 'ACTIVE',
          },
        },
        select: {
          pickerId: true,
        },
        distinct: ['pickerId'],
      }),

      /*
       * Today's packlist statistics.
       */
      prisma.packlistEntry.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          invoiceQuantity: true,
          grossWeight: true,
        },
      }),

      /*
       * Currently active deliveries.
       *
       * Useful for the admin dashboard to immediately see
       * which consignments are in progress.
       */
      prisma.packlistEntry.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          startedAt: 'asc',
        },
        select: {
          id: true,
          packlistNumber: true,
          invoiceQuantity: true,
          referenceNumber: true,
          deliveryType: true,
          grossWeight: true,
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },

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
      }),

      /*
       * Most recent deliveries.
       */
      prisma.packlistEntry.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          packlistNumber: true,
          invoiceQuantity: true,
          referenceNumber: true,
          deliveryType: true,
          grossWeight: true,
          status: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },

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
      }),
    ]);

    return NextResponse.json({
      /*
       * Picker statistics
       */
      pickers: {
        total: activePickerCount,
        busy: busyPickerCount.length,
        available: Math.max(activePickerCount - busyPickerCount.length, 0),
      },

      /*
       * Today's operational statistics.
       */
      today: {
        packlists: todayPacklistStats._count.id,
        invoiceQuantity: todayPacklistStats._sum.invoiceQuantity ?? 0,
        grossWeight: (todayPacklistStats._sum.grossWeight ?? 0).toString(),
      },

      /*
       * Currently active deliveries.
       */
      activeDeliveries: activeDeliveries.map((packlist) => ({
        id: packlist.id,
        packlistNumber: packlist.packlistNumber,
        invoiceQuantity: packlist.invoiceQuantity,
        referenceNumber: packlist.referenceNumber,
        deliveryType: packlist.deliveryType,
        grossWeight: packlist.grossWeight.toString(),
        status: packlist.status,
        startedAt: packlist.startedAt,
        completedAt: packlist.completedAt,
        createdAt: packlist.createdAt,

        createdBy: packlist.createdBy,

        pickers: packlist.pickers.map((assignment) => assignment.picker),
      })),

      /*
       * Recent deliveries.
       */
      recentPacklists: recentPacklists.map((packlist) => ({
        id: packlist.id,
        packlistNumber: packlist.packlistNumber,
        invoiceQuantity: packlist.invoiceQuantity,
        grossWeight: packlist.grossWeight.toString(),
        referenceNumber: packlist.referenceNumber,
        deliveryType: packlist.deliveryType,
        status: packlist.status,
        startedAt: packlist.startedAt,
        completedAt: packlist.completedAt,
        createdAt: packlist.createdAt,

        createdBy: packlist.createdBy,

        pickers: packlist.pickers.map((assignment) => assignment.picker),
      })),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 },
      );
    }

    console.error('Admin dashboard error:', error);

    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 },
    );
  }
}
