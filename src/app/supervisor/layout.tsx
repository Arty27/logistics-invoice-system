import { redirect } from 'next/navigation';

import { requireUser } from '@/server/auth/authorization';

import SupervisorNavigation from './navigation';

export default async function SupervisorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  if (user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (user.role === 'PICKER') {
    redirect('/picker');
  }

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      <SupervisorNavigation user={user} />
      {children}
    </div>
  );
}
