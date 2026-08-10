import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

const createPickerSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must contain exactly 10 digits'),

  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),

  password: z.string().min(8, 'Password must contain at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const result = createPickerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phoneNumber, name, password } = result.data;

    const passwordHash = await argon2.hash(password);

    const picker = await prisma.user.create({
      data: {
        phoneNumber,
        name,
        passwordHash,
        role: 'PICKER',
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: picker.id,
          phoneNumber: picker.phoneNumber,
          name: picker.name,
          role: picker.role,
          isActive: picker.isActive,
        },
      },
      { status: 201 },
    );
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
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error: 'A user with this phone number already exists.',
        },
        { status: 409 },
      );
    }

    console.error('Create picker error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
