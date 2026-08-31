'use client';

import { FormEvent, useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import Loading from '@/components/Loading';
import { getDate, getTime } from '@/lib/functions';

type RstEntry = {
  id: string;
  skuCode: string;
  quantity: number;
  enteredAt: string;
  enteredBy: {
    id: string;
    name: string;
  };
};

type ApiResponse = {
  data?: RstEntry[];
  count?: number;
  error?: string;
};

export default function RstPage() {
  const [skuCode, setSkuCode] = useState('');
  const [quantity, setQuantity] = useState('');

  const [entries, setEntries] = useState<RstEntry[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /*
   * =========================================================
   * Get today's date in YYYY-MM-DD format.
   *
   * The browser's local timezone may not necessarily be India,
   * so use Asia/Kolkata explicitly.
   * =========================================================
   */
  function getTodayDate() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  /*
   * =========================================================
   * Load RST entries.
   *
   * If no dates are supplied, the API itself defaults to today.
   * =========================================================
   */
  async function loadEntries(
    selectedStartDate?: string,
    selectedEndDate?: string,
  ) {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (selectedStartDate && selectedEndDate) {
        params.set('startDate', selectedStartDate);
        params.set('endDate', selectedEndDate);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/supervisor/rst${query ? `?${query}` : ''}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load RST entries.');
        return;
      }

      setEntries(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * =========================================================
   * Initial load.
   *
   * Default UI dates to today and load today's entries.
   * =========================================================
   */
  useEffect(() => {
    const today = getTodayDate();

    setStartDate(today);
    setEndDate(today);

    loadEntries();
  }, []);

  /*
   * =========================================================
   * Add RST entry
   * =========================================================
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!skuCode.trim()) {
      setError('SKU code is required.');
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('Quantity must be a whole number greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/supervisor/rst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skuCode: skuCode.trim(),
          quantity: parsedQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to add RST entry.');
        return;
      }

      setSuccess('Stock entry added successfully.');

      setSkuCode('');
      setQuantity('');

      /*
       * Refresh today's entries so the newly added record
       * immediately appears in the table.
       */
      const today = getTodayDate();

      setStartDate(today);
      setEndDate(today);

      await loadEntries(today, today);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * =========================================================
   * Search historical records
   * =========================================================
   */
  function handleSearch() {
    setError('');
    setSuccess('');

    if (!startDate || !endDate) {
      setError('Please select both start date and end date.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    loadEntries(startDate, endDate);
  }

  /*
   * =========================================================
   * Reset to today
   * =========================================================
   */
  function handleToday() {
    const today = getTodayDate();

    setStartDate(today);
    setEndDate(today);

    setError('');
    setSuccess('');

    loadEntries(today, today);
  }

  /*
   * =========================================================
   * Export currently displayed records to Excel
   * =========================================================
   */
  async function handleExport() {
    if (entries.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Logistics Invoice System';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('RST');

      /*
       * Columns
       */
      worksheet.columns = [
        {
          header: 'SKU Code',
          key: 'skuCode',
          width: 20,
        },
        {
          header: 'Quantity',
          key: 'quantity',
          width: 15,
        },
        {
          header: 'Entered By',
          key: 'enteredBy',
          width: 25,
        },
        {
          header: 'Entered Date',
          key: 'enteredDate',
          width: 25,
        },
        {
          header: 'Entered Time',
          key: 'enteredTime',
          width: 25,
        },
      ];

      /*
       * Header styling
       */
      const headerRow = worksheet.getRow(1);

      headerRow.font = {
        bold: true,
      };

      headerRow.alignment = {
        vertical: 'middle',
      };

      /*
       * Data rows
       */
      entries.forEach((entry) => {
        worksheet.addRow({
          skuCode: entry.skuCode,
          quantity: entry.quantity,
          enteredBy: entry.enteredBy.name,
          enteredDate: getDate(entry.enteredAt),
          enteredTime: getTime(entry.enteredAt),
        });
      });

      /*
       * Date formatting
       */
      worksheet.getColumn('enteredAt').numFmt = 'dd/mm/yyyy hh:mm:ss';

      /*
       * Total quantity
       */
      const totalQuantity = entries.reduce(
        (total, entry) => total + entry.quantity,
        0,
      );

      const totalRow = worksheet.addRow({
        skuCode: 'TOTAL',
        quantity: totalQuantity,
        enteredBy: '',
        enteredAt: '',
      });

      totalRow.font = {
        bold: true,
      };

      /*
       * Freeze header row
       */
      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];

      /*
       * Enable filtering
       */
      worksheet.autoFilter = {
        from: 'A1',
        to: 'D1',
      };

      /*
       * Generate workbook
       */
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      const filename =
        startDate && endDate
          ? `RST_${startDate}_to_${endDate}.xlsx`
          : `RST_${getTodayDate()}.xlsx`;

      link.download = filename;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('RST export error:', error);

      setError('Unable to export RST entries.');
    } finally {
      setIsExporting(false);
    }
  }

  const totalQuantity = entries.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">
          Rolling Stock Takeover
        </h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Enter and review rolling stock entries.
        </p>
      </div>

      {/* =====================================================
          ADD STOCK
          ===================================================== */}

      <section className="mb-8 rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <h2 className="text-sm font-semibold text-[#393536]">Add Stock</h2>

          <p className="mt-1 text-xs text-[#777473]">
            Enter the SKU code and quantity for today's stock takeover.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="skuCode"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                SKU Code
              </label>

              <input
                id="skuCode"
                name="skuCode"
                type="text"
                value={skuCode}
                onChange={(event) => setSkuCode(event.target.value)}
                placeholder="Enter SKU code"
                autoComplete="off"
                required
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Quantity
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Enter quantity"
                required
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-5 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          <div className="mt-6 flex justify-end border-t border-[#e5e4e2] pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-md bg-[#f14902] px-6 text-sm font-bold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <section className="mb-6 rounded-lg border border-[#dedddb] bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              From Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              To Date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="h-11 w-full rounded-md bg-[#f14902] px-5 text-sm font-bold text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {isLoading ? 'Loading...' : 'Search'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleToday}
              disabled={isLoading}
              className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-5 text-sm font-semibold text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              Today
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          RST RECORDS
          ===================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e5e4e2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#393536]">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>

            <p className="mt-1 text-xs text-[#777473]">
              Total quantity: {totalQuantity.toLocaleString('en-IN')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0 || isExporting}
            className="h-10 rounded-md border border-[#cfcfcd] bg-white px-4 text-sm font-semibold text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>

        {isLoading ? (
          <Loading />
        ) : entries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#393536]">
              No RST entries found.
            </p>

            <p className="mt-1 text-sm text-[#6b6968]">
              Try another date range or add today's stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">
                    SKU Code
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Quantity
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Entered By
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Entered At
                  </th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#eeecea] last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-[#393536]">
                      {entry.skuCode}
                    </td>

                    <td className="px-5 py-3 text-[#555251]">
                      {entry.quantity.toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3 text-[#555251]">
                      {entry.enteredBy.name}
                    </td>

                    <td className="px-5 py-3 text-[#6b6968]">
                      {new Date(entry.enteredAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
