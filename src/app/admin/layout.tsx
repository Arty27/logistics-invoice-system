import { redirect } from 'next/navigation';

import { requireUser } from '@/server/auth/authorization';

import AdminNavigation from './navigation';
import { UserProvider } from '@/components/UserContext';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  if (user.role === 'PICKER') {
    redirect('/picker');
  }
  if (user.role === 'SUPERVISOR') {
    redirect('/supervisor');
  }

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      <UserProvider user={user}>
        <AdminNavigation user={user} />
        {children}
      </UserProvider>
    </div>
  );
}
