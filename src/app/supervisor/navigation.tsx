'use client';

import { usePathname, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User } from '@/types/types';

type SupervisorNavigationProps = {
  user: User;
};

const supervisorRoutes = [
  { id: 1, label: 'Verify Invoice', route: '/supervisor', isDefault: true },
  {
    id: 2,
    label: 'My Records',
    route: '/supervisor/records',
    isDefault: false,
  },
  { id: 3, label: 'RST', route: '/supervisor/rst', isDefault: false },
];

export default function SupervisorNavigation({
  user,
}: SupervisorNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Navbar
      routes={supervisorRoutes}
      router={router}
      pathname={pathname}
      user={user}
    />
  );
}
