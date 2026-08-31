import argon2 from 'argon2';
import { Prisma, UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';

import { requireAdmin, requireUser } from '@/server/auth/authorization';

import { prisma } from '@/server/db/prisma';
import { routeModule } from 'next/dist/build/templates/pages';

/*
 * ---------------------------------------------------------
 * Create User Schema
 * ---------------------------------------------------------
 */
const createUserSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must contain exactly 10 digits'),

  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),

  password: z.string().min(8, 'Password must contain at least 8 characters'),

  role: z.enum(['ADMIN', 'SUPERVISOR', 'PICKER'], {
    message: 'Invalid user role',
  }),

  /*
   * Company is optional at schema level because
   * ADMIN users are allowed to have no company.
   *
   * We perform the role-specific validation below.
   */
  companyId: z.string().uuid('Invalid company ID').nullable().optional(),
});

/*
 * ---------------------------------------------------------
 * POST /api/users
 *
 * Create a new user.
 *
 * Rules:
 *
 * ADMIN
 *   -> companyId must be null / omitted
 *
 * SUPERVISOR
 *   -> companyId is required
 *
 * PICKER
 *   -> companyId is required
 * ---------------------------------------------------------
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { phoneNumber, name, password, role, companyId } = result.data;

    /*
     * -------------------------------------------------------
     * Role-specific company validation
     * -------------------------------------------------------
     */

    /*
     * ADMIN users should not belong to a company.
     */
    if (role === 'ADMIN' && companyId) {
      return NextResponse.json(
        {
          error: 'Admin users cannot be assigned to a company.',
        },
        { status: 400 },
      );
    }

    /*
     * SUPERVISOR and PICKER users must belong to a company.
     */
    if ((role === 'SUPERVISOR' || role === 'PICKER') && !companyId) {
      return NextResponse.json(
        {
          error: `${role === 'PICKER' ? 'Picker' : 'Supervisor'} must be assigned to a company.`,
        },
        { status: 400 },
      );
    }

    /*
     * -------------------------------------------------------
     * Validate company
     * -------------------------------------------------------
     *
     * Only do this when a company was supplied.
     */
    let company = null;

    if (companyId) {
      company = await prisma.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      });

      if (!company) {
        return NextResponse.json(
          {
            error: 'Company not found.',
          },
          { status: 404 },
        );
      }

      /*
       * Do not allow users to be assigned to an inactive
       * company.
       */
      if (!company.isActive) {
        return NextResponse.json(
          {
            error: 'Cannot assign a user to an inactive company.',
          },
          { status: 400 },
        );
      }
    }

    /*
     * -------------------------------------------------------
     * Hash password
     * -------------------------------------------------------
     */
    const passwordHash = await argon2.hash(password);

    /*
     * -------------------------------------------------------
     * Create user
     * -------------------------------------------------------
     */
    const createdUser = await prisma.user.create({
      data: {
        phoneNumber,
        name,
        passwordHash,
        role,

        /*
         * For ADMIN this will be null.
         *
         * For PICKER / SUPERVISOR this will contain the
         * validated company ID.
         */
        companyId: companyId ?? null,
      },

      select: {
        id: true,
        phoneNumber: true,
        name: true,
        role: true,
        isActive: true,
        company: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: createdUser,
      },
      { status: 201 },
    );
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

    /*
     * Unique phone number.
     */
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

    /*
     * Foreign key fallback.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        {
          error: 'The selected company does not exist.',
        },
        { status: 400 },
      );
    }

    console.error('Create user error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}

/*
 * ---------------------------------------------------------
 * GET /api/users
 *
 * Returns pickers available for delivery assignment.
 *
 * Existing behavior is preserved:
 *
 * - Current user is excluded
 * - ADMIN sees pickers from all companies
 * - Non-admin users see pickers from their company
 * - Only PICKER users are returned
 * ---------------------------------------------------------
 */
export async function GET() {
  try {
    const user = await requireUser();

    const userFilter: Prisma.UserWhereInput =
      user.role === UserRole.ADMIN
        ? {
            companyId: { not: null },
            OR: [{ role: UserRole.PICKER }, { role: UserRole.SUPERVISOR }],
          }
        : {
            companyId: user.companyId,
            role: UserRole.PICKER,
          };

    const pickers = await prisma.user.findMany({
      where: {
        /*
         * Current user should never appear in the
         * additional picker selection.
         */
        id: {
          not: user.id,
        },
        ...userFilter,
      },

      select: {
        id: true,
        name: true,
        phoneNumber: true,
        company: true,
        role: true,
        isActive: true,
        createdAt: true,
      },

      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      data: pickers,
      count: pickers.length,
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

    console.error('Get pickers error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
