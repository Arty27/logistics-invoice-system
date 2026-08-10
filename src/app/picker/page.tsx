'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'PICKER';
};

type MeResponse = {
  authenticated: boolean;
  user?: User;
};

export default function PickerPage() {
  const router = useRouter();
  const packlistInputRef = useRef<HTMLInputElement>(null);
  const [packlistNumber, setPacklistNumber] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState('');
  const [grossWeight, setGrossWeight] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/packlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packlistNumber,
          invoiceQuantity,
          grossWeight,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to submit packlist.');
        } else {
          setError(data.error ?? 'Unable to submit packlist.');
        }

        return;
      }

      setSuccess('Packlist submitted successfully.');

      setPacklistNumber('');
      setInvoiceQuantity('');
      setGrossWeight('');

      requestAnimationFrame(() => {
        packlistInputRef.current?.focus();
      });
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f6]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-8 py-6">
            <h1 className="text-xl font-semibold text-[#393536]">
              Enter Packlist
            </h1>

            <p className="mt-1 text-sm text-[#6b6968]">
              Enter the details from the packlist before submitting.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="packlistNumber"
                  className="mb-2 block text-sm font-medium text-[#393536]"
                >
                  Packlist Number
                </label>

                <input
                  ref={packlistInputRef}
                  id="packlistNumber"
                  name="packlistNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={packlistNumber}
                  onChange={(event) => {
                    const value = event.target.value;

                    if (/^\d*$/.test(value)) {
                      setPacklistNumber(value);
                    }
                  }}
                  placeholder="Enter 8-digit packlist number"
                  required
                  autoFocus
                  className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                />

                <p className="mt-1.5 text-xs text-[#777473]">
                  Enter exactly 8 digits.
                </p>
              </div>

              <div>
                <label
                  htmlFor="invoiceQuantity"
                  className="mb-2 block text-sm font-medium text-[#393536]"
                >
                  Invoice Quantity
                </label>

                <input
                  id="invoiceQuantity"
                  name="invoiceQuantity"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={invoiceQuantity}
                  onChange={(event) => setInvoiceQuantity(event.target.value)}
                  placeholder="Enter quantity"
                  required
                  className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="grossWeight"
                  className="mb-2 block text-sm font-medium text-[#393536]"
                >
                  Total Gross Weight
                </label>

                <div className="relative">
                  <input
                    id="grossWeight"
                    name="grossWeight"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={grossWeight}
                    onChange={(event) => setGrossWeight(event.target.value)}
                    placeholder="Enter gross weight"
                    required
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 pr-16 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />

                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#777473]">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-[#e5e4e2] pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-bold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Packlist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
