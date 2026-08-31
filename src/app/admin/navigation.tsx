'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User } from '@/types/types';

type AdminNavigationProps = {
  user: User;
};

const adminRoutes = [
  { id: 1, label: 'Dashboard', route: '/admin', isDefault: true },
  {
    id: 2,
    label: 'Packlists',
    route: '/admin/packlists',
    isDefault: false,
  },
  { id: 3, label: 'RST', route: '/admin/rst', isDefault: false },
  { id: 4, label: 'Company', route: '/admin/company', isDefault: false },

  {
    id: 5,
    label: 'Invoices',
    route: '/admin/invoice-verifications',
    isDefault: false,
  },
  { id: 6, label: 'Members', route: '/admin/picker', isDefault: false },
];

export default function AdminNavigation({ user }: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      router={router}
      pathname={pathname}
      routes={adminRoutes}
      user={user}
    />
  );
}
