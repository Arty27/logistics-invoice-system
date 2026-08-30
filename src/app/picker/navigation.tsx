'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

type PickerUser = {
  name: string;
  company: {
    name: string;
  } | null;
};

type PickerNavigationProps = {
  user: PickerUser;
};

export default function PickerNavigation({ user }: PickerNavigationProps) {
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

  const isRecordsPage = pathname.startsWith('/picker/records');
  const isEnterPacklistPage = !isRecordsPage;

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
                className="h-[34px] w-[34px] object-contain"
                priority
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden h-full items-center gap-1 lg:flex">
            <button
              type="button"
              onClick={() => router.push('/picker')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isEnterPacklistPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Enter Packlist
            </button>

            <button
              type="button"
              onClick={() => router.push('/picker/records')}
              className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
                isRecordsPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              My Records
            </button>
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-medium">
                {user?.company?.name}
              </p>

              <p className="text-xs text-white/75">Company</p>
            </div>
            <div className="text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-white/75">Picker</p>
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
            <button
              type="button"
              onClick={() => router.push('/picker')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isEnterPacklistPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              Enter Packlist
            </button>

            <button
              type="button"
              onClick={() => router.push('/picker/records')}
              className={`flex h-full shrink-0 cursor-pointer items-center border-b-2 px-4 text-sm font-medium ${
                isRecordsPage
                  ? 'border-white'
                  : 'border-transparent hover:bg-[#d94000]'
              }`}
            >
              My Records
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
