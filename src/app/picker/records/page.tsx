'use client';

import { useEffect, useState } from 'react';

type Packlist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  createdAt: string;
};

export default function PickerRecordsPage() {
  const [records, setRecords] = useState<Packlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await fetch('/api/packlists');

        if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? 'Unable to load records.');
          return;
        }

        const data = await response.json();

        setRecords(data.data);
      } catch {
        setError('Unable to load your records.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-[#6b6968]">Loading records...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#393536]">
          My Submitted Packlists
        </h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Packlists you have submitted.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!error && records.length === 0 && (
        <div className="rounded-lg border border-[#dedddb] bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-[#393536]">
            No packlists submitted yet.
          </p>

          <p className="mt-1 text-sm text-[#6b6968]">
            Submitted packlists will appear here.
          </p>
        </div>
      )}

      {!error && records.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-5 py-4">
            <p className="text-sm font-medium text-[#393536]">
              {records.length} submitted{' '}
              {records.length === 1 ? 'packlist' : 'packlists'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Packlist No.
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Invoice Qty
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Gross Weight
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[#eeecea] last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-[#393536]">
                      {record.packlistNumber}
                    </td>

                    <td className="px-5 py-3 text-[#555251]">
                      {record.invoiceQuantity}
                    </td>

                    <td className="px-5 py-3 text-[#555251]">
                      {record.grossWeight}
                    </td>

                    <td className="px-5 py-3 text-[#6b6968]">
                      {new Date(record.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
