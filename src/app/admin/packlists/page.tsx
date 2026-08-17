'use client';

import PacklistTable from '@/components/PacklistTable';
import { splitEvenly } from '@/lib/functions';
import { Packlist } from '@/types/Packlist';
import ExcelJS from 'exceljs';
import { useState } from 'react';

function getToday() {
  const today = new Date();

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(today);
}

export default function AdminPacklistsPage() {
  const today = getToday();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [records, setRecords] = useState<Packlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  async function loadRecords() {
    setError('');
    setHasSearched(false);

    if (!startDate || !endDate) {
      setError('Please select both a start date and an end date.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/packlists?startDate=${startDate}&endDate=${endDate}`,
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load packlists.');
        return;
      }

      setRecords(data.data);
      setHasSearched(true);
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadExcel() {
    if (records.length === 0) {
      return;
    }

    setIsDownloading(true);

    try {
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Tatvashree Logistics';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Packlists');

      worksheet.columns = [
        {
          header: 'Entry Time',
          key: 'createdAt',
          width: 22,
        },
        {
          header: 'Packlist No.',
          key: 'packlistNumber',
          width: 18,
          style: {
            numFmt: '@',
          },
        },
        {
          header: 'Invoice Qty',
          key: 'invoiceQuantity',
          width: 15,
        },
        {
          header: 'Total Gross Weight',
          key: 'grossWeight',
          width: 20,
        },
        {
          header: 'Status',
          key: 'status',
          width: 15,
        },
        {
          header: 'Started',
          key: 'startedAt',
          width: 15,
        },
        {
          header: 'Completed',
          key: 'completedAt',
          width: 15,
        },
        {
          header: 'Picker',
          key: 'picker',
          width: 25,
        },
        {
          header: 'Picker Phone',
          key: 'phoneNumber',
          width: 18,
          style: {
            numFmt: '@',
          },
        },
      ];
      for (const record of records) {
        let noOfPickers = record.pickers.length;
        let invoiceArr = splitEvenly(record.invoiceQuantity, noOfPickers);
        record.pickers.map((picker, i) => {
          worksheet.addRow({
            createdAt: new Date(record.createdAt),
            packlistNumber: String(record.packlistNumber),
            invoiceQuantity: invoiceArr[i],
            grossWeight: Number(record.grossWeight) / record.pickers.length,
            status: record.status,
            startedAt: record.startedAt,
            completedAt: record.completedAt,
            picker: picker.name,
            phoneNumber: String(picker.phoneNumber),
          });
        });
      }

      worksheet.getColumn('createdAt').numFmt = 'dd-mm-yyyy hh:mm:ss';
      worksheet.getColumn('grossWeight').numFmt = '0.00';

      worksheet.getRow(1).font = {
        bold: true,
      };

      worksheet.autoFilter = {
        from: 'A1',
        to: 'F1',
      };

      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Packlist_Report_${startDate}_to_${endDate}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Unable to generate the Excel file.');
      console.log(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">
          Packlist Records
        </h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          View and download packlist records for a selected period.
        </p>
      </div>

      <section className="rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <h2 className="text-sm font-semibold text-[#393536]">
            Select Date Range
          </h2>
        </div>

        <div className="flex flex-wrap items-end gap-5 px-6 py-6">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Start date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              End date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-md border border-[#cfcfcd] px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          <button
            type="button"
            onClick={loadRecords}
            disabled={isLoading}
            className="h-11 rounded-md bg-[#f14902] px-6 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'View Records'}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-6 mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </section>

      {hasSearched && (
        <section className="mt-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e4e2] px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold text-[#393536]">
                Packlist Records
              </h2>

              <p className="mt-1 text-xs text-[#777473]">
                {records.length} {records.length === 1 ? 'record' : 'records'}{' '}
                found
              </p>
            </div>

            <button
              type="button"
              onClick={downloadExcel}
              disabled={records.length === 0 || isDownloading}
              className="h-10 rounded-md bg-[#217346] px-5 text-sm font-medium text-white hover:bg-[#185c37] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? 'Preparing...' : 'Download Excel'}
            </button>
          </div>

          {records.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#393536]">
                No records found
              </p>

              <p className="mt-1 text-sm text-[#6b6968]">
                There are no packlists submitted during this period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {records.length > 15 && (
                <div className="border-b border-[#e5e4e2] px-6 py-3">
                  <p className="text-xs text-[#6b6968]">
                    Showing the latest 15 records. Download the Excel file to
                    view all {records.length} records.
                  </p>
                </div>
              )}
              <PacklistTable records={records.slice(0, 15)} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
