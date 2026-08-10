import argon2 from 'argon2';
import { NextResponse } from 'next/server';
import z from 'zod';

import { prisma } from '@/server/db/prisma';
import { createSession } from '@/server/auth/session';

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must containt exactly 10 digits'),
  password: z.string().min(3, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid Input',
        },
        {
          status: 400,
        },
      );
    }
    const { phoneNumber, password } = result.data;
    const user = await prisma.user.findUnique({
      where: {
        phoneNumber,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          error: 'Invalid phone number or password',
        },
        { status: 401 },
      );
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      return NextResponse.json(
        {
          error: 'Invalid phone number or password',
        },
        { status: 401 },
      );
    }
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
