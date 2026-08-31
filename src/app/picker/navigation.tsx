'use client';

import { usePathname, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import { User } from '@/types/types';

type PickerNavigationProps = {
  user: User;
};

const pickerRoutes = [
  { id: 1, label: 'Enter Packlist', route: '/picker', isDefault: true },
  {
    id: 2,
    label: 'My Records',
    route: '/picker/records',
    isDefault: false,
  },
];

export default function PickerNavigation({ user }: PickerNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      user={user}
      router={router}
      routes={pickerRoutes}
      pathname={pathname}
    />
  );
}
