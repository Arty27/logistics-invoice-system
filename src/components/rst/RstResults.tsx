'use client';

import { Download } from 'lucide-react';
import ActionButton from '@/components/ActionButton';
import RstTable from '@/components/rst/RstTable';
import type { RstEntry } from '@/types/rst';

type RstResultsProps = {
  entries: RstEntry[];
  totalQuantity: number;
  isExporting: boolean;
  formatDateTime: (date: string | null) => string;
  onExport: () => void;
};

export default function RstResults({
  entries,
  totalQuantity,
  isExporting,
  formatDateTime,
  onExport,
}: RstResultsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#eeecea] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#f14902]" />

          <div>
            <p className="text-sm font-semibold text-[#393536]">RST Records</p>

            <p className="mt-1 text-xs text-[#777473]">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·
              Total quantity:{' '}
              <span className="font-medium text-[#393536]">
                {totalQuantity.toLocaleString('en-IN')}
              </span>
            </p>
          </div>
        </div>

        <ActionButton
          variant="success"
          loading={isExporting}
          loadingText="Generating..."
          icon={<Download className="h-4 w-4" />}
          onClick={onExport}
          disabled={entries.length === 0}
          className="h-10 px-4"
        >
          Download Excel
        </ActionButton>
      </div>

      <RstTable entries={entries} formatDateTime={formatDateTime} />
    </section>
  );
}
