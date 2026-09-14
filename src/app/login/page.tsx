'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Phone,
} from 'lucide-react';

type CurrentUser = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'PICKER';
};

type MeResponse = {
  authenticated: boolean;
  user?: CurrentUser;
};

const routes = {
  ADMIN: '/admin',
  PICKER: '/picker',
  SUPERVISOR: '/supervisor',
} as const;

type UserRole = keyof typeof routes;

export default function LoginPage() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  /*
   * ---------------------------------------------------------
   * Check whether the user is already logged in
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
        });

        /*
         * 401 simply means there is no active session.
         * In that case, show the login form.
         */
        if (!response.ok) {
          if (isMounted) {
            setIsCheckingSession(false);
          }

          return;
        }

        const data: MeResponse = await response.json();

        if (!isMounted) {
          return;
        }

        if (data.authenticated && data.user) {
          const role = data.user.role as UserRole;

          router.replace(routes[role]);

          return;
        }

        setIsCheckingSession(false);
      } catch {
        /*
         * If the session check itself fails, allow the user
         * to see the login form rather than blocking them.
         */
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  /*
   * ---------------------------------------------------------
   * Handle login
   * ---------------------------------------------------------
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to sign in.');
        return;
      }

      const role = data.user.role as UserRole;

      router.replace(routes[role]);
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Checking existing session
   * ---------------------------------------------------------
   */
  if (isCheckingSession) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f6] px-4 sm:px-6">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-105 w-105 rounded-full bg-[#f14902]/[0.07] blur-3xl" />

          <div className="absolute -bottom-40 -left-40 h-105 w-105 rounded-full bg-[#393536]/4.5 blur-3xl" />

          <div className="absolute top-[18%] left-[12%] h-24 w-24 rounded-full bg-[#f14902]/[0.035] blur-2xl" />

          <div className="absolute right-[12%] bottom-[15%] h-28 w-28 rounded-full bg-[#393536]/2.5 blur-2xl" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-[loginFadeIn_0.45s_ease-out]">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-center shadow-[0_15px_45px_rgba(0,0,0,0.07)] sm:px-10">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-3 rounded-full bg-[#f14902]/10 blur-2xl" />

                <Image
                  src="/ttl.png"
                  alt="Tatvashree Logistics logo"
                  width={180}
                  height={180}
                  className="relative h-30 w-30 object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-[#f14902]" />

              <span>Checking your session...</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes loginFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation: none !important;
              transition: none !important;
            }
          }
        `}</style>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * Login page
   * ---------------------------------------------------------
   */
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f6] px-4 py-8 sm:px-6">
      {/* =====================================================
          Login Container
          ===================================================== */}
      <div className="relative z-10 w-full max-w-107.5 animate-[loginFadeIn_0.5s_ease-out]">
        {/* ===================================================
            Login Card
            =================================================== */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_15px_50px_rgba(0,0,0,0.07)] transition-shadow duration-300 hover:shadow-[0_18px_55px_rgba(0,0,0,0.09)] sm:p-9">
          {/* =================================================
              Logo
              ================================================= */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              {/* Subtle logo halo */}
              <div className="absolute inset-3 rounded-full bg-[#f14902]/10 blur-2xl" />

              <Image
                src="/ttl.png"
                alt="Tatvashree Logistics logo"
                width={180}
                height={180}
                className="relative h-30 w-30 object-contain transition-transform duration-300 hover:scale-[1.03] sm:h-32.5 sm:w-32.5"
                priority
              />
            </div>
          </div>

          {/* =================================================
              Heading
              ================================================= */}
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-bold tracking-[-0.8px] text-[#393536]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to continue to your Tatvashree dashboard.
            </p>
          </div>

          {/* =================================================
              Form
              ================================================= */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-[13px] font-semibold text-[#393536]"
              >
                Phone number
              </label>

              <div className="group relative">
                <Phone
                  size={18}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-[#f14902]"
                />

                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="username"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Enter your phone number"
                  required
                  maxLength={10}
                  className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/50 pr-4 pl-11 text-sm font-medium text-[#393536] transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f14902] focus:bg-white focus:ring-4 focus:ring-[#f14902]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[13px] font-semibold text-[#393536]"
              >
                Password
              </label>

              <div className="group relative">
                <LockKeyhole
                  size={18}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-[#f14902]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/50 pr-12 pl-11 text-sm font-medium text-[#393536] transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f14902] focus:bg-white focus:ring-4 focus:ring-[#f14902]/10"
                />

                {/* Show / Hide Password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-[#393536] active:scale-95"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex animate-[errorIn_0.2s_ease-out] items-start gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#f14902] px-4 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(241,73,2,0.22)] transition-all duration-200 hover:bg-[#dc4300] hover:shadow-[0_8px_22px_rgba(241,73,2,0.28)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />

                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* =================================================
            Footer
            ================================================= */}
        <p className="mt-5 text-center text-xs font-medium text-slate-400">
          Tatvashree Logistics Pvt. Ltd.
        </p>
      </div>

      {/* =====================================================
          Animations
          ===================================================== */}
      <style jsx>{`
        @keyframes loginFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes errorIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
