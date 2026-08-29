import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

/*
 * ---------------------------------------------------------
 * GET /api/companies
 *
 * Returns all active companies.
 * Used by the admin UI when assigning a company to a user.
 * ---------------------------------------------------------
 */
export async function GET() {
  try {
    await requireAdmin();

    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: companies,
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
          error: 'Only admins can manage companies.',
        },
        { status: 403 },
      );
    }

    console.error('Get companies error:', error);

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
 * POST /api/companies
 *
 * Creates a new company.
 * ---------------------------------------------------------
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';

    /*
     * Basic validation
     */
    if (!name) {
      return NextResponse.json(
        {
          error: 'Company name is required.',
        },
        { status: 400 },
      );
    }

    /*
     * Company names are unique in the Prisma schema.
     *
     * We still check explicitly so that the API can return
     * a useful error message instead of a raw Prisma error.
     */
    const existingCompany = await prisma.company.findUnique({
      where: {
        name,
      },
      select: {
        id: true,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          error: 'A company with this name already exists.',
        },
        { status: 409 },
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        company,
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
          error: 'Only admins can manage companies.',
        },
        { status: 403 },
      );
    }

    /*
     * Prisma unique constraint fallback.
     *
     * This protects against two admins creating the same
     * company at exactly the same time.
     */
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error: 'A company with this name already exists.',
        },
        { status: 409 },
      );
    }

    console.error('Create company error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
