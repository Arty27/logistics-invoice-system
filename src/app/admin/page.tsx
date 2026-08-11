'use client';

import { useEffect, useState } from 'react';

type RecentPacklist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  createdAt: string;
  pickerName: string;
};

type DashboardData = {
  activePickers: number;
  today: {
    packlists: number;
    invoiceQuantity: number;
    grossWeight: string;
  };
  recentPacklists: RecentPacklist[];
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/admin/dashboard');

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'Unable to load dashboard.');
          return;
        }

        setDashboard(data);
      } catch {
        setError('Unable to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-[#6b6968]">Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">Dashboard</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Overview of today's logistics activity.
        </p>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#393536]">Today</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Pickers"
            value={dashboard.activePickers.toLocaleString('en-IN')}
          />

          <StatCard
            label="Packlists"
            value={dashboard.today.packlists.toLocaleString('en-IN')}
          />

          <StatCard
            label="Invoice Quantity"
            value={dashboard.today.invoiceQuantity.toLocaleString('en-IN')}
          />

          <StatCard
            label="Gross Weight"
            value={`${Number(dashboard.today.grossWeight).toLocaleString(
              'en-IN',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )} kg`}
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#393536]">
              Recent Packlists
            </h2>

            <p className="mt-1 text-xs text-[#777473]">
              Latest 10 submitted packlists.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
          {dashboard.recentPacklists.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#6b6968]">
                No packlists have been submitted today.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                  <tr>
                    <th className="px-5 py-3 font-bold text-[#393536]">
                      Packlist No.
                    </th>

                    <th className="px-5 py-3 font-bold text-[#393536]">
                      Picker
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
                  {dashboard.recentPacklists.map((packlist) => (
                    <tr
                      key={packlist.id}
                      className="border-b border-[#eeecea] last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-[#393536]">
                        {packlist.packlistNumber}
                      </td>

                      <td className="px-5 py-3 text-[#555251]">
                        {packlist.pickerName}
                      </td>

                      <td className="px-5 py-3 text-[#555251]">
                        {packlist.invoiceQuantity.toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-3 text-[#555251]">
                        {Number(packlist.grossWeight).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        kg
                      </td>

                      <td className="px-5 py-3 text-[#6b6968]">
                        {new Date(packlist.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dedddb] bg-white px-5 py-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#393536]">{value}</p>
    </div>
  );
}
