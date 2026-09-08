'use client';

import { Download } from 'lucide-react';
import type { AdminRecord } from '@/types/delivery-records';
import DeliveryTable from './DeliveryTable';
import ActionButton from '@/components/ActionButton';

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
    <section className="rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
      {/* Results Header */}

      <div className="flex flex-col gap-4 border-b border-[#eeecea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-1 rounded-full bg-[#f14902]" />

            <h2 className="text-base font-semibold tracking-tight text-[#393536]">
              Records
            </h2>
          </div>

          <p className="mt-1.5 pl-3.25 text-sm text-[#777473]">
            {records.length} {records.length === 1 ? 'record' : 'records'} found
          </p>
        </div>

        {records.length > 0 && (
          <ActionButton
            variant="success"
            loading={isDownloading}
            loadingText="Generating..."
            icon={<Download className="h-4 w-4" />}
            onClick={onDownloadExcel}
            className="h-10 px-4"
          >
            Download Excel
          </ActionButton>
        )}
      </div>

      {/* Empty State */}

      {records.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f6]">
            <div className="h-2.5 w-2.5 rounded-full bg-[#cfcfcd]" />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#393536]">
            No records found
          </p>

          <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-[#777473]">
            Try changing the selected company, user or date range.
          </p>
        </div>
      ) : (
        <DeliveryTable records={records} formatDateTime={formatDateTime} />
      )}
    </section>
  );
}
