'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

type PickerUser = {
  name: string;
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

  return (
    <header className="bg-[#f14902] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex h-full items-center gap-8">
          <div className="rounded-full border bg-white p-1">
            <Image
              src="/ttl.png"
              alt="Tatvashree Logistics logo"
              width={34}
              height={34}
              className="h-auto max-h-24 w-auto object-contain"
              priority
            />
          </div>

          <nav className="flex h-full items-center gap-1">
            <button
              type="button"
              onClick={() => router.push('/picker')}
              className={`flex h-full items-center border-b-2 px-3 text-sm font-medium ${
                !isRecordsPage
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
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-white/75">Picker</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer text-sm font-medium hover:text-white/75"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
