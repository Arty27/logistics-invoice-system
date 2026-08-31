'use client';

import { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import { formatDuration } from '@/lib/functions';
import Loading from '@/components/Loading';

type Company = {
  id: string;
  name: string;
};

type Supervisor = {
  id: string;
  name: string;
  phoneNumber: string;
  company: {
    id: string;
    name: string;
  } | null;
};

type Verification = {
  id: string;
  invoiceNumber: string;

  invoicedQuantity: number;
  dispatchedQuantity: number | null;

  invoicedWeight: string;
  dispatchedWeight: string | null;

  remarks: string | null;
  result: string | null;

  status: string;

  startedAt: string;
  completedAt: string | null;
  createdAt: string;

  supervisor: {
    id: string;
    name: string;
    phoneNumber: string;
  };

  company: {
    id: string;
    name: string;
  };
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminInvoiceVerificationsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);

  const [companyId, setCompanyId] = useState('all');
  const [supervisorId, setSupervisorId] = useState('all');

  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());

  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * Derived companies
   * ---------------------------------------------------------
   */

  const companies: Company[] = Array.from(
    new Map(
      supervisors
        .filter((supervisor) => supervisor.company)
        .map((supervisor) => [
          supervisor.company!.id,
          {
            id: supervisor.company!.id,
            name: supervisor.company!.name,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  /*
   * ---------------------------------------------------------
   * Supervisors filtered by selected company
   * ---------------------------------------------------------
   */

  const filteredSupervisors =
    companyId === 'all'
      ? supervisors
      : supervisors.filter(
          (supervisor) => supervisor.company?.id === companyId,
        );

  /*
   * ---------------------------------------------------------
   * Load supervisors
   * ---------------------------------------------------------
   */

  async function loadSupervisors() {
    setError('');
    setIsLoadingSupervisors(true);

    try {
      const response = await fetch('/api/supervisor', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load supervisors.');
        return;
      }

      setSupervisors(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoadingSupervisors(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Load verification records
   * ---------------------------------------------------------
   */

  async function loadVerifications() {
    setError('');
    setIsLoadingRecords(true);

    try {
      const params = new URLSearchParams();

      params.set('companyId', companyId);
      params.set('supervisorId', supervisorId);
      params.set('from', fromDate);
      params.set('to', toDate);

      const response = await fetch(
        `/api/admin/invoice-verifications?${params.toString()}`,
        {
          cache: 'no-store',
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load invoice verifications.');
        return;
      }

      setVerifications(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoadingRecords(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Initial load
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadSupervisors();
  }, []);

  /*
   * ---------------------------------------------------------
   * Company change
   * ---------------------------------------------------------
   */

  function handleCompanyChange(value: string) {
    setCompanyId(value);

    /*
     * Whenever company changes, reset supervisor
     * so an old supervisor from another company
     * cannot remain selected.
     */
    setSupervisorId('all');
  }

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  function handleSearch() {
    loadVerifications();
  }

  /*
   * ---------------------------------------------------------
   * Download Excel
   * ---------------------------------------------------------
   */

  async function downloadExcel() {
    if (verifications.length === 0) {
      setError('There are no records to download.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice Verifications');

    worksheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Supervisor', key: 'supervisor', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Invoiced Quantity', key: 'invoicedQuantity', width: 18 },
      { header: 'Dispatched Quantity', key: 'dispatchedQuantity', width: 20 },
      { header: 'Invoiced Weight', key: 'invoicedWeight', width: 18 },
      { header: 'Dispatched Weight', key: 'dispatchedWeight', width: 20 },
      { header: 'Result', key: 'result', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 40 },
      { header: 'Started At', key: 'startedAt', width: 22 },
      { header: 'Completed At', key: 'completedAt', width: 22 },
      { header: 'Verification Time', key: 'verificationTime', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    for (const verification of verifications) {
      const startedAt = new Date(verification.startedAt);
      const completedAt = verification.completedAt
        ? new Date(verification.completedAt)
        : null;

      let verificationTime = '';

      if (completedAt) {
        const seconds = Math.floor(
          (completedAt.getTime() - startedAt.getTime()) / 1000,
        );

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
          verificationTime = `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
          verificationTime = `${minutes}m ${remainingSeconds}s`;
        } else {
          verificationTime = `${remainingSeconds}s`;
        }
      }

      worksheet.addRow({
        invoiceNumber: verification.invoiceNumber,
        supervisor: verification.supervisor?.name ?? '',
        company: verification.company?.name ?? '',
        invoicedQuantity: verification.invoicedQuantity,
        dispatchedQuantity: verification.dispatchedQuantity ?? '',
        invoicedWeight: verification.invoicedWeight,
        dispatchedWeight: verification.dispatchedWeight ?? '',
        result: verification.result ?? '',
        remarks: verification.remarks ?? '',
        startedAt: startedAt.toLocaleString(),
        completedAt: completedAt?.toLocaleString() ?? '',
        verificationTime,
        createdAt: new Date(verification.createdAt).toLocaleString(),
      });
    }

    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      vertical: 'middle',
    };

    worksheet.autoFilter = {
      from: 'A1',
      to: `M1`,
    };

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    link.download = `invoice-verifications-${fromDate}-to-${toDate}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* PAGE HEADER */}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#393536]">
          Invoice Verifications
        </h1>

        <p className="mt-1 text-sm text-[#6b6968]">
          View invoice verification records completed by supervisors.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* FILTERS */}

      <section className="mb-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <h2 className="text-sm font-semibold text-[#393536]">Filters</h2>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-5">
          {/* Company */}

          <div>
            <label
              htmlFor="company"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Company
            </label>

            <select
              id="company"
              value={companyId}
              onChange={(event) => handleCompanyChange(event.target.value)}
              disabled={isLoadingSupervisors}
              className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:bg-[#f7f7f6]"
            >
              <option value="all">All Companies</option>

              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisor */}

          <div>
            <label
              htmlFor="supervisor"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Supervisor
            </label>

            <select
              id="supervisor"
              value={supervisorId}
              onChange={(event) => setSupervisorId(event.target.value)}
              disabled={isLoadingSupervisors}
              className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:bg-[#f7f7f6]"
            >
              <option value="all">All Supervisors</option>

              {filteredSupervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name}
                  {companyId === 'all' && supervisor.company
                    ? ` — ${supervisor.company.name}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* From */}

          <div>
            <label
              htmlFor="fromDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              From
            </label>

            <input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          {/* To */}

          <div>
            <label
              htmlFor="toDate"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              To
            </label>

            <input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
            />
          </div>

          {/* Search */}

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoadingRecords || !fromDate || !toDate}
              className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingRecords ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>
      </section>

      {/* RESULTS */}

      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e4e2] px-6 py-5">
          <div className="flex w-full justify-between">
            <div>
              <p className="text-sm font-semibold text-[#393536]">
                {verifications.length}{' '}
                {verifications.length === 1 ? 'verification' : 'verifications'}
              </p>

              <p className="mt-1 text-xs text-[#777473]">
                Completed invoice verifications matching the selected filters.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadExcel}
              disabled={verifications.length === 0}
              className="h-10 rounded-md border border-[#cfcfcd] bg-white px-5 text-sm font-medium text-[#393536] hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download
            </button>
          </div>
        </div>

        {isLoadingRecords ? (
          <Loading />
        ) : verifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#6b6968]">
              No completed invoice verifications found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-300 text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Invoice
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Supervisor
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Company
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
                    Duration
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Completed At
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Remarks
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
                      <div>
                        <p className="font-medium text-[#393536]">
                          {verification.supervisor.name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#777473]">
                          {verification.supervisor.phoneNumber}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {verification.company.name}
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
                      {verification.result ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            verification.result === 'MATCHED'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {verification.result}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-[#555251]">
                      {formatDuration(
                        verification.startedAt,
                        verification.completedAt,
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-[#555251]">
                      {formatDateTime(verification.completedAt)}
                    </td>

                    <td className="max-w-70 px-5 py-4 text-[#555251]">
                      <span
                        className="block truncate"
                        title={verification.remarks ?? ''}
                      >
                        {verification.remarks ?? '-'}
                      </span>
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
