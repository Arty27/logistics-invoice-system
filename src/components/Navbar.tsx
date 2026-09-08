'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { NavbarItem, User } from '@/types/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getAvatarColor } from '@/lib/functions';

type NavbarProps = {
  navItems: NavbarItem[];
  user: User;
  router: AppRouterInstance;
  pathname: string;
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || 'U';
}

export default function Navbar({
  navItems,
  router,
  user,
  pathname,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
    }
  }

  const avatarColor = getAvatarColor(user.name);
  const userInitial = getInitial(user.name);

  return (
    <header className="sticky top-4 z-50 px-2 sm:px-6 lg:px-1">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border-2 border-[#f14a0239] bg-white/90 px-3 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center px-3 sm:px-5"
        >
          <Image
            src="/ttl.png"
            alt="Tatvashree Logistics logo"
            width={34}
            height={34}
            className="h-8.5 w-8.5 object-contain"
            priority
          />

          <span className="text-[25px] font-semibold tracking-[-1.5px] text-[#f14902] transition-transform duration-300 group-hover:scale-[1.03]">
            Tatvashree
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center rounded-[22px] bg-slate-50 p-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center gap-2 rounded-[18px] px-5 py-3 text-sm font-medium transition-all duration-300 ease-out ${
                  isActive
                    ? 'bg-[#f14902] text-white shadow-[0_5px_15px_rgba(241,73,2,0.25)]'
                    : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* User Information */}
          <div className="hidden items-center gap-3 border-r border-slate-200 pr-4 sm:flex">
            {/* Initial Avatar */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-all duration-300 hover:scale-105 hover:shadow-md`}
              title={user.name}
            >
              {userInitial}
            </div>

            {/* Name + Role */}
            <div className="flex min-w-0 flex-col text-right leading-tight">
              <span className="max-w-40 truncate text-sm font-semibold text-slate-900">
                {user.name}
              </span>

              <span className="mt-1 max-w-40 truncate text-xs font-medium text-slate-500">
                {user.role}
              </span>
            </div>
          </div>

          {/* Mobile Avatar */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${avatarColor} text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-all duration-300 hover:scale-105 sm:hidden`}
            title={user.name}
          >
            {userInitial}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:border-red-100 hover:bg-red-50 hover:text-red-500 active:scale-95"
          >
            <LogOut
              size={18}
              className="transition-transform duration-300 group-hover:-translate-x-0.5"
            />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 transition-all duration-300 hover:bg-slate-100 active:scale-95 lg:hidden"
          >
            <div
              className={`transition-transform duration-300 ${
                mobileOpen ? 'rotate-90' : 'rotate-0'
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl bg-white/95 shadow-[0_10px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 ease-out lg:hidden ${
          mobileOpen
            ? 'max-h-100 translate-y-0 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
        }`}
      >
        <div className="space-y-1 p-2">
          {/* Mobile User Info */}
          <div className="mb-2 flex items-center gap-3 border-b border-slate-100 px-3 py-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-semibold text-white shadow-sm`}
            >
              {userInitial}
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </span>

              <span className="mt-0.5 truncate text-xs font-medium text-slate-500">
                {user.role}
              </span>
            </div>
          </div>

          {/* Mobile Nav Items */}
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#f14902] text-white shadow-[0_5px_15px_rgba(241,73,2,0.2)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
