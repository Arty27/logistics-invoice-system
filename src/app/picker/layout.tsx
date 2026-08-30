import { redirect } from 'next/navigation';

import { requireUser } from '@/server/auth/authorization';

import PickerNavigation from './navigation';

export default async function PickerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  if (user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (user.role === 'SUPERVISOR') {
    redirect('/supervisor');
  }

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      <PickerNavigation user={user} />
      {children}
    </div>
  );
}
