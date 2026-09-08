'use client';

import { usePathname, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import { NavbarItem, User } from '@/types/types';
import { ClipboardClockIcon, NotebookPenIcon } from 'lucide-react';

type PickerNavigationProps = {
  user: User;
};

const pickerRoutes: NavbarItem[] = [
  { label: 'Enter Packlist', href: '/picker', icon: NotebookPenIcon },
  {
    label: 'My Records',
    href: '/picker/records',
    icon: ClipboardClockIcon,
  },
];

export default function PickerNavigation({ user }: PickerNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      user={user}
      router={router}
      navItems={pickerRoutes}
      pathname={pathname}
    />
  );
}
