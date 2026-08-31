'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

type AdminUser = {
  name: string;
};

type AdminNavigationProps = {
  user: AdminUser;
};

export default function AdminNavigation({ user }: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
    }
  }

  const isPacklistsPage = pathname.startsWith('/admin/packlists');
  const isPickersPage = pathname.startsWith('/admin/pickers');
  const isRstPage = pathname.startsWith('/admin/rst');
  const isCompanyPage = pathname.startsWith('/admin/company');
  const isInvoicePage = pathname.startsWith('/admin/invoice-verifications');

  const isDashboardPage =
    !isPacklistsPage &&
    !isPickersPage &&
    !isRstPage &&
    !isInvoicePage &&
    !isCompanyPage;

  return (
    <header className="bg-[#f14902] text-white shadow-sm">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            TOP ROW
            Desktop: logo + navigation + user all in one row
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
                className="h-[34px] w-[34px] object-contain"
                priority
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden h-full items-center gap-1 lg:flex">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isDashboardPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/packlists')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isPacklistsPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Packlists
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/company')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isCompanyPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Company
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/rst')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isRstPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              RST
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/invoice-verifications')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isInvoicePage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Verified Invoices
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/pickers')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isPickersPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Pickers
            </button>
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-white/75">Administrator</p>
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
          <nav
            className="flex h-12 items-center gap-1 overflow-x-auto px-4 sm:px-6"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isDashboardPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/packlists')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isPacklistsPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Packlists
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/rst')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isRstPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              RST
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/invoice-verifications')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isInvoicePage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Invoices
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/pickers')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isPickersPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Members
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
