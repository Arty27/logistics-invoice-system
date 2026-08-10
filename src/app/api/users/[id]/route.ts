import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean.' },
        { status: 400 },
      );
    }

    const picker = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!picker || picker.role !== 'PICKER') {
      return NextResponse.json({ error: 'Picker not found.' }, { status: 404 });
    }

    const updatedPicker = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedPicker,
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
        { error: 'Admin access required' },
        { status: 403 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Picker not found.' }, { status: 404 });
    }

    console.error('Update picker error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
