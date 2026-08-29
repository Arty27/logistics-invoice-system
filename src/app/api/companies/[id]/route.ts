import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/server/common/error';
import { requireAdmin } from '@/server/auth/authorization';
import { prisma } from '@/server/db/prisma';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
 * ---------------------------------------------------------
 * PATCH /api/companies/[id]
 *
 * Update:
 * - Company name
 * - Active/inactive status
 * ---------------------------------------------------------
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const body = await request.json();

    /*
     * Check that the company exists.
     */
    const existingCompany = await prisma.company.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          error: 'Company not found.',
        },
        { status: 404 },
      );
    }

    /*
     * Build update data only from fields that were supplied.
     */
    const updateData: {
      name?: string;
      isActive?: boolean;
    } = {};

    /*
     * -------------------------------------------------------
     * Name
     * -------------------------------------------------------
     */
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return NextResponse.json(
          {
            error: 'Company name must be a string.',
          },
          { status: 400 },
        );
      }

      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            error: 'Company name is required.',
          },
          { status: 400 },
        );
      }

      /*
       * If the name is not changing, there is no need to
       * perform the duplicate check against itself.
       */
      if (name !== existingCompany.name) {
        const duplicateCompany = await prisma.company.findUnique({
          where: {
            name,
          },
          select: {
            id: true,
          },
        });

        if (duplicateCompany) {
          return NextResponse.json(
            {
              error: 'A company with this name already exists.',
            },
            { status: 409 },
          );
        }
      }

      updateData.name = name;
    }

    /*
     * -------------------------------------------------------
     * Active status
     * -------------------------------------------------------
     */
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json(
          {
            error: 'isActive must be a boolean.',
          },
          { status: 400 },
        );
      }

      updateData.isActive = body.isActive;
    }

    /*
     * Nothing to update.
     */
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: 'No changes were provided.',
        },
        { status: 400 },
      );
    }

    const company = await prisma.company.update({
      where: {
        id,
      },
      data: updateData,
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
      company,
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

    /*
     * Prisma unique constraint fallback.
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

    console.error('Update company error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      { status: 500 },
    );
  }
}
