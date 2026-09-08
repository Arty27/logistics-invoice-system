'use client';

import { Loader2, Search } from 'lucide-react';
import ActionButton from '@/components/ActionButton';

type RstFiltersProps = {
  startDate: string;
  endDate: string;
  isLoading: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSearch: () => void;
  onToday: () => void;
};

const inputClasses =
  'h-11 w-full cursor-pointer rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:border-[#e3e1df] disabled:bg-[#f7f7f6] disabled:text-[#aaa8a6]';

export default function RstFilters({
  startDate,
  endDate,
  isLoading,
  onStartDateChange,
  onEndDateChange,
  onSearch,
  onToday,
}: RstFiltersProps) {
  return (
    <section className="rounded-2xl border border-[#e5e3e1] bg-white p-5 shadow-[0_4px_20px_rgba(57,53,54,0.04)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#f14902]" />

        <div>
          <h2 className="text-sm font-semibold text-[#393536]">
            Filter Records
          </h2>

          <p className="mt-1 text-xs leading-5 text-[#777473]">
            Select a date range to view rolling stock takeover entries.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
        <div>
          <label
            htmlFor="rst-start-date"
            className="mb-2 block text-sm font-medium text-[#393536]"
          >
            From Date
          </label>

          <input
            id="rst-start-date"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            disabled={isLoading}
            className={inputClasses}
          />
        </div>

        <div>
          <label
            htmlFor="rst-end-date"
            className="mb-2 block text-sm font-medium text-[#393536]"
          >
            To Date
          </label>

          <input
            id="rst-end-date"
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            disabled={isLoading}
            className={inputClasses}
          />
        </div>

        <div className="flex items-end">
          <ActionButton
            variant="primary"
            onClick={onSearch}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Loading..."
            icon={<Search className="h-4 w-4" />}
            className="lg:min-w-[110px]"
          >
            Search
          </ActionButton>
        </div>

        <div className="flex items-end">
          <ActionButton
            variant="secondary"
            onClick={onToday}
            disabled={isLoading}
            className="lg:min-w-[100px]"
          >
            Today
          </ActionButton>
        </div>
      </div>
    </section>
  );
}
