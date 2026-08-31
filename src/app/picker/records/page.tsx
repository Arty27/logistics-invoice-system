'use client';

import { Packlist } from '@/types/Packlist';
import { useEffect, useState } from 'react';
import recordsTable from '@/components/PacklistTable';
import PacklistTable from '@/components/PacklistTable';
import Loading from '@/components/Loading';

type PacklistsResponse = {
  data?: Packlist[];
  count?: number;
  error?: string;
};

export default function PickerRecordsPage() {
  const [records, setRecords] = useState<Packlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await fetch('/api/packlists', {
          cache: 'no-store',
        });

        const data: PacklistsResponse = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'Unable to load records.');
          return;
        }

        setRecords(data.data ?? []);
      } catch {
        setError('Unable to load your records.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#393536]">My Records</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Your delivery history and packlist details.
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
            No records found.
          </p>

          <p className="mt-1 text-sm text-[#6b6968]">
            Your delivery records will appear here.
          </p>
        </div>
      )}

      {!error && records.length > 0 && <PacklistTable records={records} />}
    </main>
  );
}
