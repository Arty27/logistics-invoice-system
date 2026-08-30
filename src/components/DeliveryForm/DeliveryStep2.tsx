'use client';

import { Step } from '@/app/picker/page';
import { Picker } from '@/types/Packlist';
import { DeliveryType } from '@/types/types';
import { FormEvent, useState } from 'react';

type DeliveryStep2Props = {
  setError: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedPickerIds: string[];
  setSelectedPickerIds: React.Dispatch<React.SetStateAction<string[]>>;
  availablePickers: Picker[];
  isLoadingPickers: boolean;
  deliveryType: DeliveryType;
};

const DeliveryStep2 = ({
  setError,
  setStep,
  selectedPickerIds,
  setSelectedPickerIds,
  availablePickers,
  isLoadingPickers,
  deliveryType,
}: DeliveryStep2Props) => {
  const [pickerSearch, setPickerSearch] = useState('');

  function handleTeamSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setPickerSearch('');
    setStep(3);
  }

  function removePicker(pickerId: string) {
    setSelectedPickerIds((current) => current.filter((id) => id !== pickerId));
  }

  function togglePicker(pickerId: string) {
    setSelectedPickerIds((current) => {
      if (current.includes(pickerId)) {
        return current.filter((id) => id !== pickerId);
      }

      return [...current, pickerId];
    });
  }

  /*
   * ---------------------------------------------------------
   * Filter picker list based on search
   * ---------------------------------------------------------
   */
  const filteredPickers = availablePickers.filter((picker) => {
    const search = pickerSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      picker.name.toLowerCase().includes(search) ||
      picker.phoneNumber.toLowerCase().includes(search)
    );
  });

  return (
    <div className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
      <div className="border-b border-[#e5e4e2] px-6 py-5 sm:px-8 sm:py-6">
        <h1 className="text-xl font-semibold text-[#393536]">Delivery Team</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Select everyone participating in this delivery.
        </p>
      </div>

      <form onSubmit={handleTeamSubmit} className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="space-y-6">
          {/*
           * Primary picker
           */}
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

          {/*
           * Selected additional pickers
           */}
          {selectedPickerIds.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-[#393536]">
                Selected Additional Pickers ({selectedPickerIds.length})
              </p>

              <div className="space-y-2">
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
                      className="flex items-center justify-between rounded-md border border-[#ead8d0] bg-[#fff8f5] px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#393536]">
                          {picker.name}
                        </p>

                        {picker.phoneNumber && (
                          <p className="text-xs text-[#777473]">
                            {picker.phoneNumber}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removePicker(picker.id)}
                        className="cursor-pointer px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/*
           * Search and picker selection
           */}
          <div>
            <label
              htmlFor="pickerSearch"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Add Pickers
            </label>

            <input
              id="pickerSearch"
              type="text"
              value={pickerSearch}
              onChange={(event) => setPickerSearch(event.target.value)}
              placeholder="Search by name or phone number..."
              disabled={isLoadingPickers}
              className="h-12 w-full rounded-md border border-[#cfcfcd] px-3 text-base text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:bg-[#f7f7f6]"
            />

            {isLoadingPickers ? (
              <div className="mt-3 rounded-md border border-[#dedddb] px-4 py-5 text-center">
                <p className="text-sm text-[#6b6968]">Loading pickers...</p>
              </div>
            ) : (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-[#dedddb]">
                {filteredPickers.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-[#6b6968]">
                      {pickerSearch
                        ? 'No pickers found.'
                        : 'No pickers available.'}
                    </p>
                  </div>
                ) : (
                  filteredPickers.map((picker) => {
                    const isSelected = selectedPickerIds.includes(picker.id);

                    return (
                      <button
                        key={picker.id}
                        type="button"
                        onClick={() => togglePicker(picker.id)}
                        className={`flex w-full cursor-pointer items-center justify-between border-b border-[#eeecea] px-4 py-3 text-left transition last:border-b-0 ${
                          isSelected
                            ? 'bg-[#fff8f5]'
                            : 'bg-white hover:bg-[#f7f7f6]'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-[#393536]">
                            {picker.name}
                          </p>

                          {picker.phoneNumber && (
                            <p className="mt-0.5 text-xs text-[#777473]">
                              {picker.phoneNumber}
                            </p>
                          )}
                        </div>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                            isSelected
                              ? 'border-[#f14902] bg-[#f14902] text-white'
                              : 'border-[#cfcfcd] bg-white'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <p className="mt-1.5 text-xs text-[#777473]">
              Search and select multiple pickers.
            </p>
          </div>

          {deliveryType === 'INWARD' && (
            <div className="rounded-md border border-[#ead8d0] bg-[#fff8f5] px-4 py-3">
              <p className="text-sm font-medium text-[#393536]">
                Inward delivery
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6b6968]">
                Inward deliveries require multiple pickers. Select at least one
                additional picker.
              </p>
            </div>
          )}
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
            Review Delivery
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeliveryStep2;
