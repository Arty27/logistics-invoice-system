import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

import { getCurrentUser } from './session';
import { ForbiddenError } from '../common/error';

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== UserRole.ADMIN) {
    throw new ForbiddenError();
  }

  return user;
}

export async function requireSupervisor() {
  const user = await requireUser();

  if (user.role !== UserRole.SUPERVISOR) {
    throw new ForbiddenError();
  }

  return user;
}

export async function requirePicker() {
  const user = await requireUser();

  if (user.role !== UserRole.PICKER) {
    throw new ForbiddenError();
  }

  return user;
}
