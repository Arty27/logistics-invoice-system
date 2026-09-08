'use client';

import type { AdminRecord } from '@/types/delivery-records';
import DeliveryTable from './DeliveryTable';

type DeliveryResultsProps = {
  records: AdminRecord[];
  isDownloading: boolean;
  onDownloadExcel: () => void;
  formatDateTime: (date: string | null) => string;
};

export default function DeliveryResults({
  records,
  isDownloading,
  onDownloadExcel,
  formatDateTime,
}: DeliveryResultsProps) {
  return (
    <section className="mt-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
      {/* Results Header */}

      <div className="flex flex-col gap-3 border-b border-[#dedddb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-[#393536]">Records</h2>

          <p className="mt-1 text-sm text-[#777473]">
            {records.length} {records.length === 1 ? 'record' : 'records'} found
          </p>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={isDownloading}
            className="h-10 cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-4 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? 'Generating...' : 'Download Excel'}
          </button>
        )}
      </div>

      {/* Empty State */}

      {records.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-[#393536]">No records found</p>

          <p className="mt-1 text-sm text-[#777473]">
            Try changing the selected company, user or date range.
          </p>
        </div>
      ) : (
        <DeliveryTable records={records} formatDateTime={formatDateTime} />
      )}
    </section>
  );
}
