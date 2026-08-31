'use client';

import { NavbarButton, User } from '@/types/types';
import Image from 'next/image';
import NavButton from './NavButton';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { UserRole } from '@prisma/client';

type NavbarProps = {
  routes: NavbarButton[];
  pathname: string;
  user: User;
  router: AppRouterInstance;
};

const displayRoleLabels: Record<UserRole, string> = {
  ADMIN: 'Adminstrator',
  PICKER: 'Assistant',
  SUPERVISOR: 'Supervisor',
};

const Navbar = ({ routes, pathname, user, router }: NavbarProps) => {
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
    }
  }

  return (
    <header className="bg-[#f14902] text-white shadow-sm">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            TOP ROW
            Desktop: logo + navigation + user in one row
            Tablet/Mobile: logo + user only
            ===================================================== */}
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="rounded-full border bg-white p-1">
              <Image
                src="/ttl.png"
                alt="Tatvashree Logistics logo"
                width={34}
                height={34}
                className="h-8.5 w-8.5 object-contain"
                priority
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden h-full items-center gap-1 lg:flex">
            {routes.map((routes) => (
              <NavButton
                key={routes.id}
                label={routes.label}
                pathname={pathname}
                route={routes.route}
                isDefault={routes.isDefault}
              />
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            {user.role !== 'ADMIN' && (
              <div className="text-right sm:block">
                <p className="max-w-45 truncate text-sm font-medium">
                  {user?.company?.name}
                </p>

                <p className="text-xs text-white/75">Company</p>
              </div>
            )}
            <div className="text-right sm:block">
              <p className="max-w-45 truncate text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-white/75">
                {displayRoleLabels[user.role]}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="cursor-pointer text-sm font-medium whitespace-nowrap hover:text-white/75"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* =====================================================
            SECOND ROW
            Only shown on iPad/tablet/mobile
            ===================================================== */}
        <div className="border-t border-white/15 lg:hidden">
          <nav className="flex h-12 items-center gap-1 px-4 sm:px-6">
            {routes.map((routes) => (
              <NavButton
                key={routes.id}
                label={routes.label}
                pathname={pathname}
                route={routes.route}
                isDefault={routes.isDefault}
              />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
