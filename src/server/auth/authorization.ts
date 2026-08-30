import { UserRole } from '@prisma/client';
import { getCurrentUser } from './session';
import { ForbiddenError, UnauthorizedError } from '../common/error';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
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
