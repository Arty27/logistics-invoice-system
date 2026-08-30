'use client';

import Loading from '@/components/Loading';
import { formatDuration } from '@/lib/functions';
import { useEffect, useState } from 'react';

type Verification = {
  id: string;
  invoiceNumber: string;
  invoicedQuantity: number;
  invoicedWeight: string;
  dispatchedQuantity: number | null;
  dispatchedWeight: string | null;
  remarks: string | null;
  result: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
};

export default function SupervisorRecordsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadVerifications() {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/invoice-verifications');

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load verification records.');
        return;
      }

      setVerifications(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVerifications();
  }, []);

  function formatDateTime(value: string | null) {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getResultLabel(result: string | null) {
    if (!result) {
      return '-';
    }

    return result.replace(/_/g, ' ');
  }

  function getResultClasses(result: string | null) {
    switch (result) {
      case 'MATCH':
        return 'bg-green-50 text-green-700';

      case 'DISCREPANCY':
        return 'bg-red-50 text-red-700';

      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">My Records</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          View your completed invoice verification records.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <p className="text-sm font-semibold text-[#393536]">
            {verifications.length}{' '}
            {verifications.length === 1 ? 'verification' : 'verifications'}
          </p>
        </div>

        {isLoading ? (
          <div className="px-6 py-10">
            <Loading />
          </div>
        ) : verifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[#6b6968]">
              No completed invoice verifications yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Invoice Number
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Invoiced Qty
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Dispatched Qty
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Invoiced Weight
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Dispatched Weight
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">Result</th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Completed At
                  </th>
                </tr>
              </thead>

              <tbody>
                {verifications.map((verification) => (
                  <tr
                    key={verification.id}
                    className="border-b border-[#eeecea] last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-[#393536]">
                      {verification.invoiceNumber}
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {verification.invoicedQuantity}
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {verification.dispatchedQuantity ?? '-'}
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {verification.invoicedWeight}
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {verification.dispatchedWeight ?? '-'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getResultClasses(
                          verification.result,
                        )}`}
                      >
                        {getResultLabel(verification.result)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {formatDuration(
                        verification.startedAt,
                        verification.completedAt,
                      )}
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
