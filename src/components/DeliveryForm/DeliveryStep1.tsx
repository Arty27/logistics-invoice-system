'use client';

import { Step } from '@/app/picker/page';
import { DeliveryType } from '@/types/types';
import { FormEvent } from 'react';

type DeliveryStep1Props = {
  referenceNumber: string;
  setReferenceNumber: React.Dispatch<React.SetStateAction<string>>;
  invoiceQuantity: string;
  setInvoiceQuantity: React.Dispatch<React.SetStateAction<string>>;
  grossWeight: string;
  setGrossWeight: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  deliveryType: DeliveryType;
  setDeliveryType: React.Dispatch<React.SetStateAction<DeliveryType>>;
  referenceInputRef: React.RefObject<HTMLInputElement | null>;
};

const DeliveryStep1 = ({
  referenceNumber,
  setReferenceNumber,
  setError,
  invoiceQuantity,
  setInvoiceQuantity,
  grossWeight,
  setGrossWeight,
  setStep,
  deliveryType,
  setDeliveryType,
  referenceInputRef,
}: DeliveryStep1Props) => {
  function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    const trimmedReferenceNumber = referenceNumber.trim();

    if (!trimmedReferenceNumber) {
      setError('Reference number is required.');
      return;
    }

    /*
     * Alphanumeric only.
     *
     * No fixed length.
     */
    if (!/^[A-Za-z0-9]+$/.test(trimmedReferenceNumber)) {
      setError('Reference number can contain only letters and numbers.');
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

    setReferenceNumber(trimmedReferenceNumber);

    setStep(2);
  }
  return (
    <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
      <div className="border-b border-[#e5e4e2] px-6 py-5 sm:px-8 sm:py-6">
        <h1 className="text-xl font-semibold text-[#393536]">Enter Delivery</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Enter the details for this warehouse movement.
        </p>
      </div>

      <form
        onSubmit={handleDetailsSubmit}
        className="px-6 py-6 sm:px-8 sm:py-8"
      >
        <div className="space-y-6">
          {/*
           * Delivery Type
           */}
          <div>
            <label
              htmlFor="deliveryType"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Delivery Type
            </label>

            <select
              id="deliveryType"
              value={deliveryType}
              onChange={(event) =>
                setDeliveryType(event.target.value as DeliveryType)
              }
              className="h-12 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-base text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            >
              <option value="INWARD">Inward</option>

              <option value="OUTWARD">Outward</option>

              <option value="MATERIAL_RETURN">Material Return</option>

              <option value="OTHER">Other</option>
            </select>
          </div>

          {/*
           * Reference Number
           */}
          <div>
            <label
              htmlFor="referenceNumber"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Reference Number
            </label>

            <input
              ref={referenceInputRef}
              id="referenceNumber"
              name="referenceNumber"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={referenceNumber}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();

                if (/^[A-Za-z0-9]*$/.test(value)) {
                  setReferenceNumber(value);
                }
              }}
              placeholder="Enter reference number"
              required
              autoFocus
              className="h-12 w-full rounded-md border border-[#cfcfcd] px-3 text-base text-[#393536] uppercase transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />

            <p className="mt-1.5 text-xs text-[#777473]">
              Packlist number, invoice number, inbound number, LR number, or
              other reference.
            </p>
          </div>

          {/*
           * Invoice quantity
           */}
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

          {/*
           * Gross weight
           */}
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
  );
};

export default DeliveryStep1;
