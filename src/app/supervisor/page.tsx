'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

type User = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'PICKER';
  company?: {
    name: string;
  } | null;
};

type Verification = {
  id: string;
  invoiceNumber: string;

  invoicedQuantity: number;
  invoicedWeight: string;

  dispatchedQuantity: number | null;
  dispatchedWeight: string | null;

  remarks: string | null;
  result: string | null;

  status: string;

  startedAt: string;
  completedAt: string | null;

  supervisorId: string;
  companyId: string;

  createdAt: string;
};

export default function SupervisorPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [verification, setVerification] = useState<Verification | null>(null);

  const [completedVerification, setCompletedVerification] =
    useState<Verification | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [error, setError] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoicedQuantity, setInvoicedQuantity] = useState('');
  const [invoicedWeight, setInvoicedWeight] = useState('');

  const [dispatchedQuantity, setDispatchedQuantity] = useState('');
  const [dispatchedWeight, setDispatchedWeight] = useState('');
  const [remarks, setRemarks] = useState('');

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /*
   * ---------------------------------------------------------
   * Load current user + active verification
   * ---------------------------------------------------------
   */

  async function loadPage() {
    setError('');
    setIsLoading(true);

    try {
      const [userResponse, verificationResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/invoice-verification'),
      ]);

      const userData = await userResponse.json();
      const verificationData = await verificationResponse.json();

      if (!userResponse.ok || !userData.authenticated) {
        router.replace('/login');
        return;
      }

      if (!verificationResponse.ok) {
        setError(
          verificationData.error ?? 'Unable to load invoice verification.',
        );
        return;
      }

      setUser(userData.user);
      setVerification(verificationData.data);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  /*
   * ---------------------------------------------------------
   * Live verification timer
   *
   * startedAt comes from the server.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!verification) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = new Date(verification.startedAt).getTime();

    function updateElapsedTime() {
      const now = Date.now();

      setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)));
    }

    updateElapsedTime();

    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [verification]);

  /*
   * ---------------------------------------------------------
   * Format elapsed seconds
   * ---------------------------------------------------------
   */

  function formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0',
      )}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`;
  }

  /*
   * ---------------------------------------------------------
   * Start verification
   * ---------------------------------------------------------
   */

  async function handleStartVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsStarting(true);

    try {
      const response = await fetch('/api/invoice-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber,
          invoicedQuantity: Number(invoicedQuantity),
          invoicedWeight: Number(invoicedWeight),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to start verification.');
        } else {
          setError(data.error ?? 'Unable to start verification.');
        }

        return;
      }

      setVerification(data.verification);

      /*
       * Clear the start form because the verification
       * is now active.
       */
      setInvoiceNumber('');
      setInvoicedQuantity('');
      setInvoicedWeight('');

      setDispatchedQuantity('');
      setDispatchedWeight('');
      setRemarks('');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsStarting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Complete verification
   * ---------------------------------------------------------
   */

  async function handleCompleteVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!verification) {
      return;
    }

    setError('');

    const dispatchedQty = Number(dispatchedQuantity);
    const dispatchedWt = Number(dispatchedWeight);

    /*
     * Client-side validation.
     *
     * The API should enforce this again.
     */
    if (dispatchedQty > verification.invoicedQuantity) {
      setError('Dispatched quantity cannot be greater than invoiced quantity.');
      return;
    }

    if (!remarks.trim()) {
      setError('Remarks are required.');
      return;
    }

    setIsCompleting(true);

    try {
      const response = await fetch(
        `/api/invoice-verification/${verification.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dispatchedQuantity: dispatchedQty,
            dispatchedWeight: dispatchedWt,
            remarks: remarks.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(
            firstError ?? data.error ?? 'Unable to complete verification.',
          );
        } else {
          setError(data.error ?? 'Unable to complete verification.');
        }

        return;
      }

      /*
       * The API returns the completed verification.
       *
       * Move it into completedVerification so the
       * completed screen can display the exact record
       * returned by the server.
       */
      setCompletedVerification(data.verification);

      /*
       * There is no longer an active verification.
       */
      setVerification(null);

      setDispatchedQuantity('');
      setDispatchedWeight('');
      setRemarks('');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsCompleting(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Start a new verification
   * ---------------------------------------------------------
   */

  function handleStartNewVerification() {
    setError('');
    setCompletedVerification(null);

    setInvoiceNumber('');
    setInvoicedQuantity('');
    setInvoicedWeight('');

    setDispatchedQuantity('');
    setDispatchedWeight('');
    setRemarks('');
  }

  /*
   * ---------------------------------------------------------
   * Logout
   * ---------------------------------------------------------
   */

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
    }
  }

  /*
   * ---------------------------------------------------------
   * Format date/time
   * ---------------------------------------------------------
   */

  function formatDateTime(value: string | null) {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /*
   * ---------------------------------------------------------
   * Calculate completed duration
   * ---------------------------------------------------------
   */

  function getCompletedDuration(completed: Verification) {
    if (!completed.completedAt) {
      return '-';
    }

    const started = new Date(completed.startedAt).getTime();
    const ended = new Date(completed.completedAt).getTime();

    const seconds = Math.max(0, Math.floor((ended - started) / 1000));

    return formatDuration(seconds);
  }

  /*
   * ---------------------------------------------------------
   * Loading
   * ---------------------------------------------------------
   */

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f6]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[#393536]">
            Invoice Verification
          </h1>

          <p className="mt-1 text-sm text-[#6b6968]">
            Verify the stock against the invoice details.
          </p>
        </div>

        {/* Error */}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            COMPLETED VERIFICATION
            =================================================== */}

        {completedVerification ? (
          <section className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#393536]">
                    Verification Completed
                  </h2>

                  <p className="mt-1 text-sm text-[#6b6968]">
                    The invoice verification has been completed successfully.
                  </p>
                </div>

                <span className="inline-flex shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Completed
                </span>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoice Number
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {completedVerification.invoiceNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">Result</p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {completedVerification.result ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoiced Quantity
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {completedVerification.invoicedQuantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Dispatched Quantity
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {completedVerification.dispatchedQuantity ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoiced Weight
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {completedVerification.invoicedWeight}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Dispatched Weight
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {completedVerification.dispatchedWeight ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Verification Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {getCompletedDuration(completedVerification)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Completed At
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {formatDateTime(completedVerification.completedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#e5e4e2] pt-6">
                <p className="text-xs font-medium text-[#777473]">Remarks</p>

                <div className="mt-2 rounded-md border border-[#e5e4e2] bg-[#f7f7f6] px-4 py-3">
                  <p className="text-sm whitespace-pre-wrap text-[#393536]">
                    {completedVerification.remarks || '-'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartNewVerification}
                  className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] sm:w-auto"
                >
                  Start New Verification
                </button>
              </div>
            </div>
          </section>
        ) : verification ? (
          /* =================================================
             ACTIVE VERIFICATION
             ================================================= */

          <section className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#393536]">
                    Active Verification
                  </h2>

                  <p className="mt-1 text-sm text-[#6b6968]">
                    Check the warehouse stock against the invoice.
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-[#777473]">
                    Verification time
                  </p>

                  <p className="mt-1 font-mono text-lg font-semibold text-[#393536]">
                    {formatDuration(elapsedSeconds)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCompleteVerification} className="px-6 py-6">
              {/* Invoice details */}

              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoice Number
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {verification.invoiceNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoiced Quantity
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {verification.invoicedQuantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#777473]">
                    Invoiced Weight
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#393536]">
                    {verification.invoicedWeight}
                  </p>
                </div>
              </div>

              <div className="my-6 border-t border-[#e5e4e2]" />

              {/* Dispatched details */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="dispatchedQuantity"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Dispatched quantity
                  </label>

                  <input
                    id="dispatchedQuantity"
                    type="number"
                    min="0"
                    step="1"
                    value={dispatchedQuantity}
                    onChange={(event) =>
                      setDispatchedQuantity(event.target.value)
                    }
                    required
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />

                  <p className="mt-1.5 text-xs text-[#777473]">
                    Cannot exceed {verification.invoicedQuantity}.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="dispatchedWeight"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Dispatched weight
                  </label>

                  <input
                    id="dispatchedWeight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={dispatchedWeight}
                    onChange={(event) =>
                      setDispatchedWeight(event.target.value)
                    }
                    required
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />
                </div>
              </div>

              {/* Remarks */}

              <div className="mt-5">
                <label
                  htmlFor="remarks"
                  className="mb-2 block text-sm font-medium text-[#393536]"
                >
                  Remarks
                  <span className="ml-1 text-[#f14902]">*</span>
                </label>

                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  required
                  rows={4}
                  placeholder="Mention any discrepancy or relevant observation..."
                  className="w-full resize-y rounded-md border border-[#cfcfcd] px-3 py-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                />
              </div>

              {/* Complete */}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isCompleting ? 'Completing...' : 'Complete Verification'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* =================================================
             START NEW VERIFICATION
             ================================================= */

          <section className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5">
              <h2 className="text-sm font-semibold text-[#393536]">
                Start New Verification
              </h2>

              <p className="mt-1 text-sm text-[#6b6968]">
                Enter the invoice details before checking the warehouse stock.
              </p>
            </div>

            <form onSubmit={handleStartVerification} className="px-6 py-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="invoiceNumber"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Invoice number
                  </label>

                  <input
                    id="invoiceNumber"
                    type="text"
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                    required
                    placeholder="Enter invoice number"
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoicedQuantity"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Invoiced quantity
                  </label>

                  <input
                    id="invoicedQuantity"
                    type="number"
                    min="1"
                    step="1"
                    value={invoicedQuantity}
                    onChange={(event) =>
                      setInvoicedQuantity(event.target.value)
                    }
                    required
                    placeholder="Enter quantity"
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invoicedWeight"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Invoiced weight
                  </label>

                  <input
                    id="invoicedWeight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoicedWeight}
                    onChange={(event) => setInvoicedWeight(event.target.value)}
                    required
                    placeholder="Enter weight"
                    className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isStarting}
                  className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isStarting ? 'Starting...' : 'Start Verification'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
