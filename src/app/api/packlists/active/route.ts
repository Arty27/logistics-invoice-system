import { NextResponse } from 'next/server';

import { UnauthorizedError, ForbiddenError } from '@/server/common/error';
import { requirePicker } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

export async function GET() {
  try {
    const picker = await requirePicker();

    const packlist = await prisma.packlistEntry.findFirst({
      where: {
        status: 'ACTIVE',
        pickers: {
          some: {
            pickerId: picker.id,
          },
        },
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

        pickers: {
          select: {
            picker: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!packlist) {
      return NextResponse.json({
        data: null,
      });
    }

    return NextResponse.json({
      data: {
        id: packlist.id,
        packlistNumber: packlist.packlistNumber,
        invoiceQuantity: packlist.invoiceQuantity,
        grossWeight: packlist.grossWeight.toString(),
        status: packlist.status,
        startedAt: packlist.startedAt,
        completedAt: packlist.completedAt,
        createdAt: packlist.createdAt,
        pickers: packlist.pickers.map((assignment) => assignment.picker),
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'Only pickers can access active deliveries.' },
        { status: 403 },
      );
    }

    console.error('Get active delivery error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
