'use client';

import { useState } from 'react';

import RstFilters from '@/components/rst/RstFilters';
import RstResults from '@/components/rst/RstResults';
import { useRstRecords } from '@/hooks/useRstRecords';

import { exportToExcel } from '@/lib/excel/exporter';
import { rstColumns } from '@/lib/excel/reports/rst';
import { formatDateTime } from '@/lib/functions';
import PageHeader from '@/components/PageHeader';
import { NotebookPenIcon } from 'lucide-react';

export default function RstPage() {
  const {
    entries,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    isLoading,
    error,
    success,
    search,
    showToday,
    totalQuantity,
  } = useRstRecords();

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (entries.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      await exportToExcel({
        fileName:
          startDate && endDate
            ? `RST_${startDate}_to_${endDate}.xlsx`
            : `RST_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'RST',
        data: entries,
        columns: rstColumns,
      });
    } catch (error) {
      console.error('RST export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f6] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl animate-[pageFadeIn_400ms_ease-out]">
        {/* PAGE HEADER */}

        <PageHeader
          title="Rolling Stock Takeover"
          description="Enter and review rolling stock entries."
          icon={<NotebookPenIcon className="h-8 w-8 text-[#f14902]" />}
        />

        {/* FILTERS */}

        <RstFilters
          startDate={startDate}
          endDate={endDate}
          isLoading={isLoading}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSearch={search}
          onToday={showToday}
        />

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-5 animate-[errorIn_250ms_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* RESULTS */}

        <div className="mt-6 animate-[resultsFadeIn_300ms_ease-out]">
          {isLoading ? (
            <section className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
              <div className="flex items-center gap-2 text-sm text-[#777473]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d8d6d4] border-t-[#f14902]" />
                Loading records...
              </div>
            </section>
          ) : (
            <RstResults
              entries={entries}
              totalQuantity={totalQuantity}
              isExporting={isExporting}
              formatDateTime={formatDateTime}
              onExport={handleExport}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes resultsFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes errorIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
