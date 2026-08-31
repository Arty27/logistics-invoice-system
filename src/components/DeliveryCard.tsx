'use client';
import { formatDuration } from '@/lib/functions';
import { Packlist } from '@/types/Packlist';
import { DELIVERY_TYPE_LABELS } from '@/types/types';
import ActiveIcon from './ActiveIcon';
import ConfirmationDialog from './ConfirmationDialog';

type DeliveryCardProps = {
  delivery: Packlist;
  error?: string;
  handleStartNewDelivery?: () => void;
  isCompletingDelivery?: boolean;
  setShowCompleteConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
};

const DeliveryCard = ({
  delivery,
  error,
  handleStartNewDelivery,
  isCompletingDelivery,
  setShowCompleteConfirmation,
}: DeliveryCardProps) => {
  const isActive = delivery.status === 'ACTIVE';
  return (
    <main className="min-h-screen bg-[#f7f7f6]">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-wide text-green-600 uppercase">
            {isActive ? 'Active Delivery' : 'Delivery Completed'}
          </p>

          <h1 className="mt-1 text-xl font-semibold text-[#393536]">
            {isActive
              ? 'Delivery in Progress'
              : 'Delivery Successfully Completed'}
          </h1>

          <p className="mt-1 text-sm text-[#6b6968]">
            {isActive
              ? 'This delivery is currently active.'
              : 'The delivery has been recorded successfully.'}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-5 py-5 sm:px-6">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Reference Number
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-wide text-[#393536]">
                  {delivery.referenceNumber}
                </p>
              </div>
              <ActiveIcon iconType={delivery.status} />
            </div>
          </div>

          <div className="divide-y divide-[#eeecea]">
            {/*
             * TIME TAKEN
             *
             * This is intentionally more prominent.
             */}
            {!isActive && (
              <div className="bg-[#fff8f5] px-5 py-6 text-center sm:px-6">
                <p className="text-xs font-semibold tracking-wide text-[#777473] uppercase">
                  Time Taken
                </p>

                <p className="mt-2 text-2xl font-bold tracking-tight text-[#f14902] sm:text-3xl">
                  {formatDuration(delivery.startedAt, delivery.completedAt)}
                </p>

                <p className="mt-2 text-xs text-[#777473]">
                  Total time from starting to completing the delivery
                </p>
              </div>
            )}

            {/*
             * Delivery type
             */}
            <div className="px-5 py-4 sm:px-6">
              <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                Delivery Type
              </p>

              <p className="mt-1 text-sm font-medium text-[#393536]">
                {DELIVERY_TYPE_LABELS[delivery.deliveryType]}
              </p>
            </div>

            {/*
             * Started / completed timestamps
             */}
            <div className="grid grid-cols-1 divide-y divide-[#eeecea] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Started
                </p>

                <p className="mt-1 text-sm text-[#393536]">
                  {delivery.startedAt
                    ? new Date(delivery.startedAt).toLocaleString('en-IN')
                    : 'Not available'}
                </p>
              </div>

              {!isActive && (
                <div className="px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                    Completed
                  </p>

                  <p className="mt-1 text-sm text-[#393536]">
                    {delivery.completedAt
                      ? new Date(delivery.completedAt).toLocaleString('en-IN')
                      : 'Not available'}
                  </p>
                </div>
              )}
            </div>

            {/*
             * Quantity / weight
             */}
            <div className="grid grid-cols-2 divide-x divide-[#eeecea]">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Invoice Quantity
                </p>

                <p className="mt-1 text-base font-semibold text-[#393536]">
                  {delivery.invoiceQuantity}
                </p>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                  Gross Weight
                </p>

                <p className="mt-1 text-base font-semibold text-[#393536]">
                  {delivery.grossWeight} kg
                </p>
              </div>
            </div>

            {/*
             * Delivery team
             */}
            <div className="px-5 py-5 sm:px-6">
              <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
                Delivery Team
              </p>

              <div className="mt-3 space-y-2">
                {delivery.pickers.map((picker, index) => (
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
              </div>

              <p className="mt-3 text-xs text-[#777473]">
                Total pickers: {delivery.pickers.length}
              </p>
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
            {isActive ? (
              <button
                type="button"
                onClick={() => setShowCompleteConfirmation(true)}
                className="h-12 w-full cursor-pointer rounded-md bg-[#393536] px-5 text-sm font-semibold text-white transition hover:bg-[#292727] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCompletingDelivery}
              >
                End Delivery
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartNewDelivery}
                className="h-12 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-semibold text-white transition hover:bg-[#d94000]"
              >
                Start New Delivery
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DeliveryCard;
