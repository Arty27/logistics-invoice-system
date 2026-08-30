'use client';

import ConfirmationDialog from '@/components/ConfirmationDialog';
import DeliveryCard from '@/components/DeliveryCard';
import DeliveryStep1 from '@/components/DeliveryForm/DeliveryStep1';
import DeliveryStep2 from '@/components/DeliveryForm/DeliveryStep2';
import DeliveryStep3 from '@/components/DeliveryForm/DeliveryStep3';
import Loading from '@/components/Loading';
import { Packlist, Picker } from '@/types/Packlist';
import { DeliveryType } from '@/types/types';
import { useEffect, useRef, useState } from 'react';

export type Step = 1 | 2 | 3;

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
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);

  const [referenceNumber, setReferenceNumber] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState('');
  const [grossWeight, setGrossWeight] = useState('');

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('OUTWARD');

  const [availablePickers, setAvailablePickers] = useState<Picker[]>([]);
  const [selectedPickerIds, setSelectedPickerIds] = useState<string[]>([]);

  const [activeDelivery, setActiveDelivery] = useState<Packlist | null>(null);

  /*
   * Completed delivery is kept temporarily so that
   * we can show the completion summary and time taken.
   */
  const [completedDelivery, setCompletedDelivery] = useState<Packlist | null>(
    null,
  );

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
   * Load current active delivery
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
   * Load available pickers when entering Step 2
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

        const users = (data.data ?? []) as unknown as Picker[];

        /*
         * The backend /api/users endpoint is expected to
         * already filter out the current user and restrict
         * the results to the current user's company.
         *
         * The frontend additionally ensures that only
         * active PICKER users are displayed.
         */
        setAvailablePickers(
          users.filter(
            (user) => user.role === 'PICKER' && user.isActive !== false,
          ),
        );
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
          referenceNumber,
          invoiceQuantity,
          grossWeight,
          deliveryType,

          /*
           * Backend accepts an array of picker IDs.
           */
          additionalPickerIds: selectedPickerIds,
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

      if (!data.packlist) {
        setError(
          'Delivery was completed but no delivery details were returned.',
        );

        setShowCompleteConfirmation(false);
        return;
      }

      /*
       * IMPORTANT:
       *
       * Instead of immediately setting activeDelivery to null
       * and returning to the start screen, we keep the completed
       * delivery so we can show:
       *
       * - Reference number
       * - Delivery type
       * - Started time
       * - Completed time
       * - Total time taken
       * - Delivery team
       */
      setCompletedDelivery(data.packlist);
      setActiveDelivery(null);
      setShowCompleteConfirmation(false);
    } catch {
      setError('Unable to connect to the server. Please try again.');

      setShowCompleteConfirmation(false);
    } finally {
      setIsCompletingDelivery(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Start a new delivery after completion
   * ---------------------------------------------------------
   */
  function handleStartNewDelivery() {
    setCompletedDelivery(null);

    setReferenceNumber('');
    setInvoiceQuantity('');
    setGrossWeight('');
    setDeliveryType('OUTWARD');

    setSelectedPickerIds([]);
    setError('');

    setStep(1);

    requestAnimationFrame(() => {
      referenceInputRef.current?.focus();
    });
  }

  /*
   * ---------------------------------------------------------
   * Loading state
   * ---------------------------------------------------------
   */
  if (isLoadingDelivery) {
    return <Loading />;
  }

  /*
   * =========================================================
   * COMPLETED DELIVERY
   * =========================================================
   */
  if (completedDelivery) {
    return (
      <DeliveryCard
        error={error}
        delivery={completedDelivery}
        handleStartNewDelivery={handleStartNewDelivery}
        setShowCompleteConfirmation={setShowCompleteConfirmation}
      />
    );
  }

  /*
   * =========================================================
   * ACTIVE DELIVERY
   * =========================================================
   */
  if (activeDelivery) {
    return (
      <>
        <DeliveryCard
          delivery={activeDelivery}
          error={error}
          isCompletingDelivery={isCompletingDelivery}
          setShowCompleteConfirmation={setShowCompleteConfirmation}
        />
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
      </>
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
          <DeliveryStep1
            referenceNumber={referenceNumber}
            setReferenceNumber={setReferenceNumber}
            setError={setError}
            invoiceQuantity={invoiceQuantity}
            setInvoiceQuantity={setInvoiceQuantity}
            grossWeight={grossWeight}
            setGrossWeight={setGrossWeight}
            setStep={setStep}
            referenceInputRef={referenceInputRef}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
          />
        )}
        {/*
         * =====================================================
         * STEP 2
         * =====================================================
         */}
        {step === 2 && (
          <DeliveryStep2
            setStep={setStep}
            setError={setError}
            selectedPickerIds={selectedPickerIds}
            setSelectedPickerIds={setSelectedPickerIds}
            isLoadingPickers={isLoadingPickers}
            deliveryType={deliveryType}
            availablePickers={availablePickers}
          />
        )}

        {/*
         * =====================================================
         * STEP 3
         * =====================================================
         */}
        {step === 3 && (
          <DeliveryStep3
            referenceNumber={referenceNumber}
            invoiceQuantity={invoiceQuantity}
            grossWeight={grossWeight}
            selectedPickerIds={selectedPickerIds}
            deliveryType={deliveryType}
            availablePickers={availablePickers}
            setError={setError}
            setStep={setStep}
            setShowStartConfirmation={setShowStartConfirmation}
          />
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
