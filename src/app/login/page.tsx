'use client';

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/picker');
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f6] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-[#dedddb] bg-white px-8 py-10 shadow-sm">
          <div className="mb-8 flex justify-center">
            <Image
              src="/ttl.png"
              alt="Tatvashree Logistics logo"
              width={220}
              height={120}
              className="h-auto max-h-24 w-auto object-contain"
              priority
            />
          </div>

          <div className="mb-8">
            <h1 className="cursor-pointer text-center text-2xl font-semibold text-[#393536]">
              Sign in
            </h1>

            <p className="mt-2 text-center text-sm text-[#6b6968]">
              Enter your phone number and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Phone number
              </label>

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
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-4 text-sm font-medium text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-[#777473]">
          Tatvashree Logistics Pvt. Ltd.
        </p>
      </div>
    </main>
  );
}
