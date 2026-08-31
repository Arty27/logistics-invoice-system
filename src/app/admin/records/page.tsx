'use client';

import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import { formatDuration, getDate, getTime } from '@/lib/functions';

type Company = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'SUPERVISOR' | 'PICKER';
  isActive: boolean;
  company: {
    id: string;
    name: string;
  } | null;
};

type RecordType = 'PACKLIST' | 'INVOICE_VERIFICATION';

type VerificationResult = 'MATCHED' | 'MISMATCHED' | string;

type AdminRecord = {
  id: string;
  type: RecordType;

  referenceNumber: string;
  invoiceNumber?: string | null;

  quantity: number | null;
  weight: string | null;

  invoiceQuantity?: number | null;
  dispatchedQuantity?: number | null;

  grossWeight?: string | null;
  dispatchedWeight?: string | null;

  result?: VerificationResult | null;
  remarks?: string | null;

  status: string;

  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;

  user: {
    id: string;
    name: string;
    role: 'SUPERVISOR' | 'PICKER';
    phoneNumber?: string;
  };

  company: {
    id: string;
    name: string;
  };
};

type CompanyResponse = {
  data: Company[];
};

type UsersResponse = {
  data: User[];
};

type RecordsResponse = {
  data: AdminRecord[];
  count: number;
};

const today = new Date().toISOString().split('T')[0];

export default function AdminInvoiceVerificationsPage() {
  /*
   * ---------------------------------------------------------
   * Companies
   * ---------------------------------------------------------
   */

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  /*
   * ---------------------------------------------------------
   * Users
   *
   * Users are intentionally NOT fetched on page load.
   *
   * Once the admin selects a company, all users are fetched
   * exactly once and retained in memory.
   * ---------------------------------------------------------
   */

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  /*
   * ---------------------------------------------------------
   * Filters
   * ---------------------------------------------------------
   */

  const [companyId, setCompanyId] = useState('all');

  const [userType, setUserType] = useState<'all' | 'SUPERVISOR' | 'PICKER'>(
    'all',
  );

  const [userId, setUserId] = useState('all');

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  /*
   * ---------------------------------------------------------
   * Records
   * ---------------------------------------------------------
   */

  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * Load companies
   *
   * This is the only API call made automatically when
   * the page opens.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      try {
        setIsLoadingCompanies(true);

        const response = await fetch('/api/companies', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load companies.');
        }

        const data: CompanyResponse = await response.json();

        if (mounted) {
          setCompanies(data.data ?? []);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);

        if (mounted) {
          setError('Unable to load companies.');
        }
      } finally {
        if (mounted) {
          setIsLoadingCompanies(false);
        }
      }
    }

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * Load users
   *
   * First time a company is selected:
   *
   * GET /api/users
   *
   * After that, users remain in memory and no further
   * users API calls are made during this page session.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (companyId === 'all') {
      return;
    }

    if (usersLoaded) {
      return;
    }

    let mounted = true;

    async function loadUsers() {
      try {
        setIsLoadingUsers(true);
        setError('');

        const response = await fetch('/api/users', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load users.');
        }

        const data: UsersResponse = await response.json();

        if (!mounted) {
          return;
        }

        setUsers(data.data ?? []);
        setUsersLoaded(true);
      } catch (err) {
        console.error('Failed to load users:', err);

        if (mounted) {
          setError('Unable to load users.');
        }
      } finally {
        if (mounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [companyId, usersLoaded]);

  /*
   * ---------------------------------------------------------
   * Company-filtered users
   * ---------------------------------------------------------
   */

  const companyUsers = useMemo(() => {
    if (companyId === 'all') {
      return users;
    }

    return users.filter((user) => user.company?.id === companyId);
  }, [users, companyId]);

  /*
   * ---------------------------------------------------------
   * User-type-filtered users
   * ---------------------------------------------------------
   */

  const filteredUsers = useMemo(() => {
    if (userType === 'all') {
      return companyUsers;
    }

    return companyUsers.filter((user) => user.role === userType);
  }, [companyUsers, userType]);

  /*
   * ---------------------------------------------------------
   * Company change
   * ---------------------------------------------------------
   */

  function handleCompanyChange(value: string) {
    setCompanyId(value);

    /*
     * Company affects the available users.
     * Therefore reset the dependent selections.
     */
    setUserType('all');
    setUserId('all');

    /*
     * Do not clear users here.
     *
     * If users have already been fetched, we reuse them.
     */
  }

  /*
   * ---------------------------------------------------------
   * User type change
   * ---------------------------------------------------------
   */

  function handleUserTypeChange(value: 'all' | 'SUPERVISOR' | 'PICKER') {
    setUserType(value);

    /*
     * The available users changed,
     * so reset the specific user.
     */
    setUserId('all');
  }

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  async function handleSearch() {
    setError('');

    if (!fromDate || !toDate) {
      setError('Please select both dates.');
      return;
    }

    if (companyId === '') {
      setError('Please select a company to fetch records');
      return;
    }

    if (fromDate > toDate) {
      setError('The from date cannot be after the to date.');
      return;
    }

    try {
      setIsSearching(true);

      const params = new URLSearchParams({
        companyId,
        userType,
        userId,
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/admin/records?${params.toString()}`, {
        cache: 'no-store',
      });

      const data: RecordsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data && 'error' in data
            ? String((data as unknown as { error: string }).error)
            : 'Unable to fetch records.',
        );
      }
      console.log(data.data);
      setRecords(data.data ?? []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search records error:', err);

      setRecords([]);
      setHasSearched(true);

      setError(err instanceof Error ? err.message : 'Unable to fetch records.');
    } finally {
      setIsSearching(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Excel download
   *
   * IMPORTANT:
   * We use the records already returned by Search.
   *
   * Therefore downloading does NOT make another DB/API call.
   * ---------------------------------------------------------
   */

  async function handleDownloadExcel() {
    if (records.length === 0) {
      return;
    }

    try {
      setIsDownloading(true);

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Tatvashree Logistics';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Delivery Records');

      worksheet.columns = [
        {
          header: 'Type',
          key: 'type',
          width: 24,
        },
        {
          header: 'Company',
          key: 'company',
          width: 25,
        },
        {
          header: 'User',
          key: 'user',
          width: 25,
        },
        {
          header: 'Role',
          key: 'role',
          width: 16,
        },
        {
          header: 'Reference / Invoice',
          key: 'reference',
          width: 25,
        },
        {
          header: 'Invoiced Quantity',
          key: 'invoicedQuantity',
          width: 20,
        },
        {
          header: 'Dispatched Quantity',
          key: 'dispatchedQuantity',
          width: 22,
        },
        {
          header: 'Invoiced Weight',
          key: 'invoicedWeight',
          width: 20,
        },
        {
          header: 'Dispatched Weight',
          key: 'dispatchedWeight',
          width: 22,
        },
        {
          header: 'Result',
          key: 'result',
          width: 18,
        },
        {
          header: 'Remarks',
          key: 'remarks',
          width: 35,
        },
        {
          header: 'Status',
          key: 'status',
          width: 16,
        },
        {
          header: 'Duration',
          key: 'duration',
          width: 24,
        },
        {
          header: 'Start Date',
          key: 'startDate',
          width: 24,
        },
        {
          header: 'Start Time',
          key: 'startTime',
          width: 24,
        },
        {
          header: 'End Date',
          key: 'endDate',
          width: 24,
        },
        {
          header: 'End Time',
          key: 'endTime',
          width: 24,
        },
      ];

      records.forEach((record) => {
        worksheet.addRow({
          type:
            record.type === 'PACKLIST' ? 'Packlist' : 'Invoice Verification',

          company: record.company.name,

          user: record.user.name,

          role: record.user.role === 'SUPERVISOR' ? 'Supervisor' : 'Picker',

          reference:
            record.type === 'INVOICE_VERIFICATION'
              ? (record.invoiceNumber ?? record.referenceNumber)
              : record.referenceNumber,

          invoicedQuantity: record.invoiceQuantity,

          dispatchedQuantity: record.dispatchedQuantity ?? '',

          invoicedWeight: record.grossWeight,

          dispatchedWeight: record.dispatchedWeight ?? '',

          result: record.result ?? '',

          remarks: record.remarks ?? '',

          status: record.status,
          duration: formatDuration(record.startedAt, record.completedAt),

          startDate: getDate(record.startedAt),
          startTime: getTime(record.startedAt),

          endDate: getDate(record.completedAt),
          endTime: getTime(record.completedAt),
        });
      });

      /*
       * Make the header bold.
       */

      worksheet.getRow(1).font = {
        bold: true,
      };

      /*
       * Freeze the header row.
       */

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

      const anchor = document.createElement('a');

      anchor.href = url;

      anchor.download = `delivery-records-${fromDate}-to-${toDate}.xlsx`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel download error:', err);

      setError('Unable to generate the Excel file.');
    } finally {
      setIsDownloading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f6] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        {/* =====================================================
            PAGE HEADER
            ===================================================== */}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#393536]">
            Delivery Records
          </h1>

          <p className="mt-1 text-sm text-[#6b6968]">
            View packlists and invoice verifications by company, user and date
            range.
          </p>
        </div>

        {/* =====================================================
            FILTER CARD
            ===================================================== */}

        <section className="rounded-lg border border-[#dedddb] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#393536]">Filters</h2>

            <p className="mt-1 text-sm text-[#777473]">
              Select a company first, then narrow the records by user.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* =================================================
                COMPANY
                ================================================= */}

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
                disabled={isLoadingCompanies}
                className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              >
                <option value="">Select Company</option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* =================================================
                USER TYPE
                ================================================= */}

            <div>
              <label
                htmlFor="userType"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Role
              </label>

              <select
                id="userType"
                value={userType}
                onChange={(event) =>
                  handleUserTypeChange(
                    event.target.value as 'all' | 'SUPERVISOR' | 'PICKER',
                  )
                }
                disabled={companyId === 'all' || !usersLoaded || isLoadingUsers}
                className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              >
                <option value="all">All Roles</option>

                <option value="SUPERVISOR">Supervisors</option>

                <option value="PICKER">Pickers</option>
              </select>
            </div>

            {/* =================================================
                USER
                ================================================= */}

            <div>
              <label
                htmlFor="user"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                User
              </label>

              <select
                id="user"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                disabled={companyId === 'all' || !usersLoaded || isLoadingUsers}
                className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              >
                <option value="all">All Users</option>

                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (
                    {user.role === 'SUPERVISOR' ? 'Supervisor' : 'Picker'})
                  </option>
                ))}
              </select>

              {isLoadingUsers && (
                <p className="mt-1.5 text-xs text-[#777473]">
                  Loading users...
                </p>
              )}

              {companyId === 'all' && (
                <p className="mt-1.5 text-xs text-[#777473]">
                  Select a company to load users.
                </p>
              )}
            </div>

            {/* =================================================
                FROM DATE
                ================================================= */}

            <div>
              <label
                htmlFor="fromDate"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                From date
              </label>

              <input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            {/* =================================================
                TO DATE
                ================================================= */}

            <div>
              <label
                htmlFor="toDate"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                To date
              </label>

              <input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>
          </div>

          {/* =================================================
              FILTER INFORMATION
              ================================================= */}

          <div className="mt-5 rounded-md border border-[#ecebea] bg-[#fafafa] px-4 py-3">
            <p className="text-xs leading-5 text-[#6b6968]">
              {companyId === 'all'
                ? 'Select a company to load the available supervisors and pickers.'
                : usersLoaded
                  ? `${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'} available for the selected filters.`
                  : 'Loading users for the selected company...'}
            </p>
          </div>

          {/* =================================================
              ERROR
              ================================================= */}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="h-11 cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-medium text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? 'Searching...' : 'Search Records'}
            </button>
          </div>
        </section>

        {/* =====================================================
            RESULTS
            ===================================================== */}

        {hasSearched && (
          <section className="mt-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
            {/* =================================================
                RESULTS HEADER
                ================================================= */}

            <div className="flex flex-col gap-3 border-b border-[#dedddb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-[#393536]">
                  Records
                </h2>

                <p className="mt-1 text-sm text-[#777473]">
                  {records.length} {records.length === 1 ? 'record' : 'records'}{' '}
                  found
                </p>
              </div>

              {records.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={isDownloading}
                  className="h-10 cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-4 text-sm font-medium text-[#393536] transition hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloading ? 'Generating...' : 'Download Excel'}
                </button>
              )}
            </div>

            {/* =================================================
                EMPTY STATE
                ================================================= */}

            {records.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-medium text-[#393536]">
                  No records found
                </p>

                <p className="mt-1 text-sm text-[#777473]">
                  Try changing the selected company, user or date range.
                </p>
              </div>
            ) : (
              /* =================================================
                 TABLE
                 ================================================= */

              <div className="overflow-x-auto">
                <table className="w-full min-w-275 border-collapse">
                  <thead>
                    <tr className="border-b border-[#dedddb] bg-[#fafafa]">
                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Type
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Company
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        User
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Reference
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Quantity
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Weight
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[#6b6968] uppercase">
                        Completed
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={`${record.type}-${record.id}`}
                        className="border-b border-[#ecebea] last:border-b-0 hover:bg-[#fafafa]"
                      >
                        {/* Type */}

                        <td className="px-4 py-4 text-sm text-[#393536]">
                          <span className="inline-flex rounded-full bg-[#f3f3f2] px-2.5 py-1 text-xs font-medium text-[#5e5c5b]">
                            {record.type === 'PACKLIST'
                              ? 'Packlist'
                              : 'Invoice'}
                          </span>
                        </td>

                        {/* Company */}

                        <td className="px-4 py-4 text-sm text-[#393536]">
                          {record.company.name}
                        </td>

                        {/* User */}

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-[#393536]">
                            {record.user.name}
                          </p>

                          <p className="mt-0.5 text-xs text-[#777473]">
                            {record.user.role === 'SUPERVISOR'
                              ? 'Supervisor'
                              : 'Picker'}
                          </p>
                        </td>

                        {/* Reference */}

                        <td className="px-4 py-4 text-sm font-medium text-[#393536]">
                          {record.type === 'INVOICE_VERIFICATION'
                            ? (record.invoiceNumber ?? record.referenceNumber)
                            : record.referenceNumber}
                        </td>

                        {/* Quantity */}

                        <td className="px-4 py-4 text-right text-sm text-[#393536]">
                          {record.invoiceQuantity}
                        </td>

                        {/* Weight */}

                        <td className="px-4 py-4 text-right text-sm text-[#393536]">
                          {record.grossWeight}
                        </td>

                        {/* Result */}

                        {/* Status */}

                        <td className="px-4 py-4 text-sm text-[#393536]">
                          {record.status}
                        </td>

                        {/* Completed */}

                        <td className="px-4 py-4 text-sm text-[#6b6968]">
                          {formatDateTime(record.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/*
 * ---------------------------------------------------------
 * Date formatting
 * ---------------------------------------------------------
 */

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
