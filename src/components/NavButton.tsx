'use client';

import { useRouter } from 'next/navigation';

const NavButton = ({
  label,
  pathname,
  route,
  isDefault,
}: {
  label: string;
  pathname: string;
  route: string;
  isDefault: boolean;
}) => {
  const router = useRouter();
  const isCurrentRoute = isDefault
    ? pathname === route
    : pathname === route || pathname.startsWith(`${route}/`);
  return (
    <button
      type="button"
      onClick={() => router.push(route)}
      className={`flex h-full cursor-pointer items-center border-b-2 px-3 text-sm font-medium ${
        isCurrentRoute
          ? 'border-white'
          : 'border-transparent hover:bg-[#d94000]'
      }`}
    >
      {label}
    </button>
  );
};

export default NavButton;
