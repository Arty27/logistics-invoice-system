'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User } from '@/types/types';
import {
  BarChart3,
  Building2Icon,
  LayoutDashboard,
  NotebookPenIcon,
  UsersIcon,
} from 'lucide-react';

type AdminNavigationProps = {
  user: User;
};

const navItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Records',
    href: '/admin/records',
    icon: BarChart3,
  },
  {
    label: 'RST',
    href: '/admin/rst',
    icon: NotebookPenIcon,
  },
  {
    label: 'Company',
    href: '/admin/company',
    icon: Building2Icon,
  },
  {
    label: 'Members',
    href: '/admin/pickers',
    icon: UsersIcon,
  },
];

export default function AdminNavigation({ user }: AdminNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      router={router}
      navItems={navItems}
      user={user}
      pathname={pathname}
    />
  );
}
