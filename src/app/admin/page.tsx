'use client';

import PacklistTable from '@/components/PacklistTable';
import { Packlist } from '@/types/Packlist';
import { useEffect, useState } from 'react';

type Picker = {
  id: string;
  name: string;
  phoneNumber: string;
};

type ActiveDelivery = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: Picker | null;
  pickers: Picker[];
};

type RecentPacklist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: Picker | null;
  pickers: Picker[];
};

type DashboardData = {
  pickers: {
    total: number;
    busy: number;
    available: number;
  };

  today: {
    packlists: number;
    invoiceQuantity: number;
    grossWeight: string;
  };

  activeDeliveries: ActiveDelivery[];

  recentPacklists: Packlist[];
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/admin/dashboard', {
          cache: 'no-store',
        });

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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">Dashboard</h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          Overview of today's logistics activity.
        </p>
      </div>

      {/* Picker Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#393536]">
            Picker Overview
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Pickers"
            value={dashboard.pickers.total.toLocaleString('en-IN')}
          />

          <StatCard
            label="Available Pickers"
            value={dashboard.pickers.available.toLocaleString('en-IN')}
          />

          <StatCard
            label="Busy Pickers"
            value={dashboard.pickers.busy.toLocaleString('en-IN')}
          />
        </div>
      </section>

      {/* Today's Statistics */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#393536]">Today</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Active Deliveries */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#393536]">
            Active Deliveries
          </h2>

          <p className="mt-1 text-xs text-[#777473]">
            Deliveries currently in progress.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
          {dashboard.activeDeliveries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#6b6968]">No active deliveries.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eeecea]">
              {dashboard.activeDeliveries.map((delivery) => (
                <ActiveDeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Packlists */}
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#393536]">
            Recent Packlists
          </h2>

          <p className="mt-1 text-xs text-[#777473]">Latest 10 packlists.</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
          {dashboard.recentPacklists.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#6b6968]">
                No packlists have been submitted yet.
              </p>
            </div>
          ) : (
            <PacklistTable records={dashboard.recentPacklists} />
          )}
        </div>
      </section>
    </main>
  );
}

function ActiveDeliveryCard({ delivery }: { delivery: ActiveDelivery }) {
  return (
    <div className="relative p-5">
      {/* Active indicator */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />

          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>

        <span className="text-xs font-medium text-green-700">Active</span>
      </div>

      <div className="pr-24">
        <p className="text-base font-semibold text-[#393536]">
          {delivery.packlistNumber}
        </p>

        <p className="mt-1 text-xs text-[#777473]">
          Started {formatDateTime(delivery.startedAt)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#777473]">Invoice Quantity</p>

          <p className="mt-1 text-sm font-medium text-[#393536]">
            {delivery.invoiceQuantity.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#777473]">Gross Weight</p>

          <p className="mt-1 text-sm font-medium text-[#393536]">
            {Number(delivery.grossWeight).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            kg
          </p>
        </div>

        <div>
          <p className="text-xs text-[#777473]">Primary Picker</p>

          <p className="mt-1 text-sm font-medium text-[#393536]">
            {delivery.createdBy?.name ?? '—'}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#777473]">Pickers</p>

          <p className="mt-1 text-sm font-medium text-[#393536]">
            {delivery.pickers.length}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-[#eeecea] pt-4">
        <p className="text-xs text-[#777473]">Assigned Pickers</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {delivery.pickers.map((picker) => (
            <span
              key={picker.id}
              className="rounded-full bg-[#f7f7f6] px-2.5 py-1 text-xs text-[#555251]"
            >
              {picker.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PickerList({ pickers }: { pickers: Picker[] }) {
  if (pickers.length === 0) {
    return <span className="text-[#777473]">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {pickers.map((picker) => (
        <span
          key={picker.id}
          className="rounded-full bg-[#f7f7f6] px-2 py-1 text-xs text-[#555251]"
        >
          {picker.name}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
}) {
  const classes = {
    ACTIVE: 'border-green-200 bg-green-50 text-green-700',
    COMPLETED: 'border-blue-200 bg-blue-50 text-blue-700',
    LEGACY: 'border-gray-200 bg-gray-50 text-gray-600',
  };

  const labels = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    LEGACY: 'Legacy',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-IN');
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
