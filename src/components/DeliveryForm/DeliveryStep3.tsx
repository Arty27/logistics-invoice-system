'use client';

import { DELIVERY_TYPE_LABELS, DeliveryType } from '@/types/types';
import ReviewRow from '../ReviewRow';
import { Picker } from '@/types/Packlist';
import { Step } from '@/app/picker/page';

type DeliveryStep3Props = {
  referenceNumber: string;
  invoiceQuantity: string;
  grossWeight: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedPickerIds: string[];
  availablePickers: Picker[];
  deliveryType: DeliveryType;
  setShowStartConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
};

const DeliveryStep3 = ({
  referenceNumber,
  invoiceQuantity,
  grossWeight,
  selectedPickerIds,
  deliveryType,
  availablePickers,
  setError,
  setStep,
  setShowStartConfirmation,
}: DeliveryStep3Props) => {
  return (
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
          <ReviewRow
            label="Delivery Type"
            value={DELIVERY_TYPE_LABELS[deliveryType]}
          />

          <ReviewRow label="Reference Number" value={referenceNumber} />

          <ReviewRow label="Invoice Quantity" value={invoiceQuantity} />

          <ReviewRow label="Gross Weight" value={`${grossWeight} kg`} />

          <div className="px-4 py-4">
            <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
              Delivery Team
            </p>

            <div className="mt-3 space-y-2">
              <div className="rounded-md bg-[#f7f7f6] px-3 py-2.5">
                <p className="text-sm font-medium text-[#393536]">You</p>

                <p className="text-xs text-[#777473]">Primary picker</p>
              </div>

              {selectedPickerIds.map((pickerId) => {
                const picker = availablePickers.find(
                  (item) => item.id === pickerId,
                );

                if (!picker) {
                  return null;
                }

                return (
                  <div
                    key={picker.id}
                    className="rounded-md bg-[#f7f7f6] px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-[#393536]">
                      {picker.name}
                    </p>

                    <p className="text-xs text-[#777473]">Additional picker</p>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-[#777473]">
              Total pickers: {selectedPickerIds.length + 1}
            </p>
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
  );
};

export default DeliveryStep3;
