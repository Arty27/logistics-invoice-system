import { requireAdmin } from '@/server/auth/authorization';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { prisma } from '@/server/db/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [activePickerCount, todayPacklistStats, recentPacklists] =
      await Promise.all([
        prisma.user.count({
          where: {
            role: 'PICKER',
            isActive: true,
          },
        }),
        prisma.packlistEntry.aggregate({
          where: {
            createdAt: {
              gte: startOfToday,
              lte: endOfToday,
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
        prisma.packlistEntry.findMany({
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            packlistNumber: true,
            invoiceQuantity: true,
            grossWeight: true,
            createdAt: true,
            picker: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);
    return NextResponse.json({
      activePickers: activePickerCount,

      today: {
        packlists: todayPacklistStats._count.id,
        invoiceQuantity: todayPacklistStats._sum.invoiceQuantity ?? 0,
        grossWeight: (todayPacklistStats._sum.grossWeight ?? 0).toString(),
      },

      recentPacklists: recentPacklists.map((packlist) => ({
        id: packlist.id,
        packlistNumber: packlist.packlistNumber,
        invoiceQuantity: packlist.invoiceQuantity,
        grossWeight: packlist.grossWeight.toString(),
        createdAt: packlist.createdAt,
        pickerName: packlist.picker.name,
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
