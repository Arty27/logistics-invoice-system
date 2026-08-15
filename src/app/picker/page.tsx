'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

type Picker = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'PICKER';
};

type Packlist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  pickers: Picker[];
};

type Step = 1 | 2 | 3;

type ApiResponse = {
  error?: string;
  details?: Record<string, string[]>;
  data?: Packlist[];
  count?: number;
  packlist?: Packlist;
  success?: boolean;
};

type ActiveDeliveryResponse = {
  error?: string;
  data: Packlist | null;
};

export default function PickerPage() {
  const packlistInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);

  const [packlistNumber, setPacklistNumber] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState('');
  const [grossWeight, setGrossWeight] = useState('');

  const [availablePickers, setAvailablePickers] = useState<Picker[]>([]);
  const [selectedPickerId, setSelectedPickerId] = useState('');

  const [activeDelivery, setActiveDelivery] = useState<Packlist | null>(null);

  const [isLoadingDelivery, setIsLoadingDelivery] = useState(true);
  const [isLoadingPickers, setIsLoadingPickers] = useState(false);

  const [showStartConfirmation, setShowStartConfirmation] = useState(false);

  const [showCompleteConfirmation, setShowCompleteConfirmation] =
    useState(false);

  const [isStartingDelivery, setIsStartingDelivery] = useState(false);

  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * Load the current active delivery.
   *
   * We deliberately use the existing packlists endpoint rather
   * than calling /api/auth/me again.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    async function loadCurrentDelivery() {
      try {
        setIsLoadingDelivery(true);
        setError('');

        const response = await fetch('/api/packlists/active', {
          method: 'GET',
          cache: 'no-store',
        });

        const data: ActiveDeliveryResponse = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'Unable to load your delivery.');
          return;
        }

        setActiveDelivery(data.data);
      } catch {
        setError('Unable to connect to the server. Please try again.');
      } finally {
        setIsLoadingDelivery(false);
      }
    }

    loadCurrentDelivery();
  }, []);

  /*
   * ---------------------------------------------------------
   * Load available pickers when entering Step 2.
   *
   * We assume an admin/picker endpoint already exists:
   * GET /api/users?role=PICKER
   *
   * If your existing users API uses a different query shape,
   * only this request needs to be adjusted.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (step !== 2 || availablePickers.length > 0) {
      return;
    }

    async function loadPickers() {
      try {
        setIsLoadingPickers(true);
        setError('');

        const response = await fetch('/api/users', {
          method: 'GET',
          cache: 'no-store',
        });

        const data: ApiResponse = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'Unable to load pickers.');
          return;
        }

        /*
         * Adjust this if your users API returns a different
         * response property.
         */
        const users = (data.data ?? []) as unknown as Picker[];

        setAvailablePickers(users);
      } catch {
        setError('Unable to load available pickers.');
      } finally {
        setIsLoadingPickers(false);
      }
    }

    loadPickers();
  }, [step, availablePickers.length]);

  /*
   * ---------------------------------------------------------
   * Step 1 → Step 2
   * ---------------------------------------------------------
   */
  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!/^[A-Za-z0-9]{8}$/.test(packlistNumber)) {
      setError(
        'Packlist number must contain exactly 8 alphanumeric characters.',
      );
      return;
    }

    if (!invoiceQuantity || Number(invoiceQuantity) <= 0) {
      setError('Invoice quantity must be greater than zero.');
      return;
    }

    if (!grossWeight || Number(grossWeight) <= 0) {
      setError('Gross weight must be greater than zero.');
      return;
    }

    setStep(2);
  }

  /*
   * ---------------------------------------------------------
   * Step 2 → Step 3
   * ---------------------------------------------------------
   */
  function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setStep(3);
  }

  /*
   * ---------------------------------------------------------
   * Start delivery
   * ---------------------------------------------------------
   */
  async function handleStartDelivery() {
    setError('');
    setIsStartingDelivery(true);

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
          additionalPickerIds: selectedPickerId ? [selectedPickerId] : [],
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to start delivery.');
        } else {
          setError(data.error ?? 'Unable to start delivery.');
        }

        setShowStartConfirmation(false);
        return;
      }

      if (!data.packlist) {
        setError('Delivery was created but no delivery details were returned.');
        setShowStartConfirmation(false);
        return;
      }

      setActiveDelivery(data.packlist);
      setShowStartConfirmation(false);
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setShowStartConfirmation(false);
    } finally {
      setIsStartingDelivery(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Complete delivery
   * ---------------------------------------------------------
   */
  async function handleCompleteDelivery() {
    if (!activeDelivery) {
      return;
    }

    setError('');
    setIsCompletingDelivery(true);

    try {
      const response = await fetch(
        `/api/packlists/${activeDelivery.id}/complete`,
        {
          method: 'POST',
        },
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to complete delivery.');
        setShowCompleteConfirmation(false);
        return;
      }

      setActiveDelivery(null);
      setShowCompleteConfirmation(false);

      /*
       * Reset the form so the picker can immediately start
       * another delivery.
       */
      setPacklistNumber('');
      setInvoiceQuantity('');
      setGrossWeight('');
      setSelectedPickerId('');
      setStep(1);

      requestAnimationFrame(() => {
        packlistInputRef.current?.focus();
      });
    } catch {
      setError('Unable to connect to the server. Please try again.');
      setShowCompleteConfirmation(false);
    } finally {
      setIsCompletingDelivery(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Loading state
   * ---------------------------------------------------------
   */
  if (isLoadingDelivery) {
    return (
      <main className="min-h-screen bg-[#f7f7f6]">
        <div className="mx-auto max-w-2xl px-5 py-10 sm:px-6">
          <div className="rounded-lg border border-[#dedddb] bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-[#6b6968]">
              Checking your current delivery...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ACTIVE DELIVERY
   * =========================================================
   */
  if (activeDelivery) {
    const additionalPickers = activeDelivery.pickers.slice(1);

    return (
      <main className="min-h-screen bg-[#f7f7f6]">
        <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-wide text-[#f14902] uppercase">
              Active Delivery
            </p>

            <h1 className="mt-1 text-xl font-semibold text-[#393536]">
              Delivery in Progress
            </h1>

            <p className="mt-1 text-sm text-[#6b6968]">
              This delivery is currently active.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
            {/* Active status indicator */}
            <div
              className="absolute top-4 right-4 flex items-center gap-2"
              aria-label="Delivery active"
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>

              <span className="text-xs font-medium text-green-700">Active</span>
            </div>
            <div className="border-b border-[#e5e4e2] px-5 py-5 sm:px-6">
              <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                Packlist Number
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-wide text-[#393536]">
                {activeDelivery.packlistNumber}
              </p>
            </div>

            <div className="divide-y divide-[#eeecea]">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Started
                </p>

                <p className="mt-1 text-sm text-[#393536]">
                  {activeDelivery.startedAt
                    ? new Date(activeDelivery.startedAt).toLocaleString('en-IN')
                    : 'Not available'}
                </p>
              </div>

              <div className="grid grid-cols-2 divide-x divide-[#eeecea]">
                <div className="px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                    Invoice Quantity
                  </p>

                  <p className="mt-1 text-base font-semibold text-[#393536]">
                    {activeDelivery.invoiceQuantity}
                  </p>
                </div>

                <div className="px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                    Gross Weight
                  </p>

                  <p className="mt-1 text-base font-semibold text-[#393536]">
                    {activeDelivery.grossWeight} kg
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Delivery Team
                </p>

                <div className="mt-3 space-y-2">
                  {activeDelivery.pickers.map((picker, index) => (
                    <div
                      key={picker.id}
                      className="flex items-center justify-between rounded-md bg-[#f7f7f6] px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#393536]">
                          {picker.name}
                        </p>

                        <p className="text-xs text-[#777473]">
                          {index === 0 ? 'Primary picker' : 'Additional picker'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {additionalPickers.length === 0 && (
                    <p className="text-sm text-[#777473]">
                      No additional picker assigned.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5e4e2] px-5 py-5 sm:px-6">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowCompleteConfirmation(true)}
                className="h-12 w-full cursor-pointer rounded-md bg-[#393536] px-5 text-sm font-semibold text-white transition hover:bg-[#292727] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCompletingDelivery}
              >
                End Delivery
              </button>
            </div>
          </div>
        </div>

        {showCompleteConfirmation && (
          <ConfirmationDialog
            title="End Delivery?"
            description="Are you sure you want to end this delivery? This will mark the delivery as completed."
            cancelLabel="Cancel"
            confirmLabel="End Delivery"
            isSubmitting={isCompletingDelivery}
            onCancel={() => setShowCompleteConfirmation(false)}
            onConfirm={handleCompleteDelivery}
          />
        )}
      </main>
    );
  }

  /*
   * =========================================================
   * START DELIVERY FLOW
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#f7f7f6]">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-[#777473]">
            <span className={step === 1 ? 'font-semibold text-[#f14902]' : ''}>
              Details
            </span>

            <span>→</span>

            <span className={step === 2 ? 'font-semibold text-[#f14902]' : ''}>
              Delivery Team
            </span>

            <span>→</span>

            <span className={step === 3 ? 'font-semibold text-[#f14902]' : ''}>
              Review
            </span>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#e5e4e2]">
            <div
              className="h-full rounded-full bg-[#f14902] transition-all duration-300"
              style={{
                width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%',
              }}
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/*
         * =====================================================
         * STEP 1
         * =====================================================
         */}
        {step === 1 && (
          <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5 sm:px-8 sm:py-6">
              <h1 className="text-xl font-semibold text-[#393536]">
                Enter Packlist
              </h1>

              <p className="mt-1 text-sm text-[#6b6968]">
                Enter the details from the packlist.
              </p>
            </div>

            <form
              onSubmit={handleDetailsSubmit}
              className="px-6 py-6 sm:px-8 sm:py-8"
            >
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
                    inputMode="text"
                    autoComplete="off"
                    maxLength={8}
                    value={packlistNumber}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();

                      if (/^[A-Za-z0-9]*$/.test(value)) {
                        setPacklistNumber(value);
                      }
                    }}
                    placeholder="Enter 8-character packlist number"
                    required
                    autoFocus
                    className="h-12 w-full rounded-md border border-[#cfcfcd] px-3 text-base text-[#393536] uppercase transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                  />

                  <p className="mt-1.5 text-xs text-[#777473]">
                    Enter exactly 8 alphanumeric characters.
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
                    className="h-12 w-full rounded-md border border-[#cfcfcd] px-3 text-base text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
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
                      className="h-12 w-full rounded-md border border-[#cfcfcd] px-3 pr-16 text-base text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                    />

                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#777473]">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#e5e4e2] pt-6">
                <button
                  type="submit"
                  className="h-12 w-full cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-semibold text-white transition hover:bg-[#d94000]"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/*
         * =====================================================
         * STEP 2
         * =====================================================
         */}
        {step === 2 && (
          <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5 sm:px-8 sm:py-6">
              <h1 className="text-xl font-semibold text-[#393536]">
                Delivery Team
              </h1>

              <p className="mt-1 text-sm text-[#6b6968]">
                Select an additional picker if required.
              </p>
            </div>

            <form
              onSubmit={handleTeamSubmit}
              className="px-6 py-6 sm:px-8 sm:py-8"
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#393536]">
                    Primary Picker
                  </p>

                  <div className="rounded-md border border-[#dedddb] bg-[#f7f7f6] px-4 py-3">
                    <p className="text-sm font-medium text-[#393536]">You</p>

                    <p className="mt-0.5 text-xs text-[#777473]">
                      You are starting this delivery.
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="additionalPicker"
                    className="mb-2 block text-sm font-medium text-[#393536]"
                  >
                    Additional Picker
                  </label>

                  <select
                    id="additionalPicker"
                    value={selectedPickerId}
                    onChange={(event) =>
                      setSelectedPickerId(event.target.value)
                    }
                    disabled={isLoadingPickers}
                    className="h-12 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-base text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:bg-[#f7f7f6]"
                  >
                    <option value="">No additional picker</option>

                    {availablePickers.map((availablePicker) => (
                      <option
                        key={availablePicker.id}
                        value={availablePicker.id}
                      >
                        {availablePicker.name}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1.5 text-xs text-[#777473]">
                    You can add one additional picker to this delivery.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e5e4e2] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  className="h-12 cursor-pointer rounded-md border border-[#cfcfcd] px-6 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6]"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoadingPickers}
                  className="h-12 cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-semibold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingPickers ? 'Loading...' : 'Review Delivery'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/*
         * =====================================================
         * STEP 3
         * =====================================================
         */}
        {step === 3 && (
          <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
            <div className="border-b border-[#e5e4e2] px-6 py-5 sm:px-8 sm:py-6">
              <h1 className="text-xl font-semibold text-[#393536]">
                Review Delivery
              </h1>

              <p className="mt-1 text-sm text-[#6b6968]">
                Check the details before starting the delivery.
              </p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <div className="divide-y divide-[#eeecea] rounded-md border border-[#dedddb]">
                <ReviewRow label="Packlist Number" value={packlistNumber} />

                <ReviewRow label="Invoice Quantity" value={invoiceQuantity} />

                <ReviewRow label="Gross Weight" value={`${grossWeight} kg`} />

                <div className="px-4 py-4">
                  <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                    Delivery Team
                  </p>

                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-[#393536]">You</p>

                    {selectedPickerId && (
                      <p className="text-sm text-[#555251]">
                        {availablePickers.find(
                          (picker) => picker.id === selectedPickerId,
                        )?.name ?? 'Additional picker'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-[#ead8d0] bg-[#fff8f5] px-4 py-4">
                <p className="text-sm font-semibold text-[#393536]">
                  Are you sure you want to start the delivery?
                </p>

                <p className="mt-1 text-sm leading-5 text-[#6b6968]">
                  Once submitted, you cannot change these details.
                </p>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e5e4e2] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(2);
                  }}
                  className="h-12 cursor-pointer rounded-md border border-[#cfcfcd] px-6 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6]"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setShowStartConfirmation(true)}
                  className="h-12 cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-semibold text-white transition hover:bg-[#d94000]"
                >
                  Start Delivery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showStartConfirmation && (
        <ConfirmationDialog
          title="Start Delivery?"
          description="Are you sure you want to start the delivery? Once submitted, you cannot change the details."
          cancelLabel="Go Back"
          confirmLabel="Start Delivery"
          isSubmitting={isStartingDelivery}
          onCancel={() => setShowStartConfirmation(false)}
          onConfirm={handleStartDelivery}
        />
      )}
    </main>
  );
}

/*
 * ---------------------------------------------------------
 * Review row
 * ---------------------------------------------------------
 */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
        {label}
      </p>

      <p className="text-sm font-medium text-[#393536] sm:text-right">
        {value}
      </p>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * Confirmation dialog
 * ---------------------------------------------------------
 */
function ConfirmationDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full rounded-t-xl bg-white shadow-xl sm:max-w-md sm:rounded-lg">
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-[#393536]">{title}</h2>

          <p className="mt-2 text-sm leading-5 text-[#6b6968]">{description}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e5e4e2] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 cursor-pointer rounded-md border border-[#cfcfcd] px-5 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-semibold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
