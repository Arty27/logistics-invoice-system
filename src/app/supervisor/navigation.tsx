'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { NavbarItem, User } from '@/types/types';
import {
  BookCheckIcon,
  ClipboardClockIcon,
  NotebookPenIcon,
} from 'lucide-react';

type SupervisorNavigationProps = {
  user: User;
};

const supervisorRoutes: NavbarItem[] = [
  { label: 'Verify Invoice', href: '/supervisor', icon: BookCheckIcon },
  {
    label: 'My Records',
    href: '/supervisor/records',
    icon: ClipboardClockIcon,
  },
  { label: 'RST', href: '/supervisor/rst', icon: NotebookPenIcon },
];

export default function SupervisorNavigation({
  user,
}: SupervisorNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      navItems={supervisorRoutes}
      router={router}
      pathname={pathname}
      user={user}
    />
  );
}
