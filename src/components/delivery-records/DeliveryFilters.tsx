'use client';

import type { Company, User, UserType } from '@/types/delivery-records';

type DeliveryFiltersProps = {
  companies: Company[];
  filteredUsers: User[];

  companyId: string;
  userType: UserType;
  userId: string;

  fromDate: string;
  toDate: string;

  isLoadingCompanies: boolean;
  usersLoaded: boolean;
  isLoadingUsers: boolean;
  isSearching: boolean;

  error: string;

  onCompanyChange: (value: string) => void;
  onUserTypeChange: (value: UserType) => void;
  onUserChange: (value: string) => void;

  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;

  onSearch: () => void;
};

export default function DeliveryFilters({
  companies,
  filteredUsers,

  companyId,
  userType,
  userId,

  fromDate,
  toDate,

  isLoadingCompanies,
  usersLoaded,
  isLoadingUsers,
  isSearching,

  error,

  onCompanyChange,
  onUserTypeChange,
  onUserChange,

  onFromDateChange,
  onToDateChange,

  onSearch,
}: DeliveryFiltersProps) {
  const usersDisabled = companyId === 'all' || !usersLoaded || isLoadingUsers;

  return (
    <section className="rounded-lg border border-[#dedddb] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#393536]">Filters</h2>

        <p className="mt-1 text-sm text-[#777473]">
          Select a company first, then narrow the records by user.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
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
            onChange={(event) => onCompanyChange(event.target.value)}
            disabled={isLoadingCompanies}
            className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
          >
            <option value="all">Select Company</option>

            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Type */}

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
              onUserTypeChange(event.target.value as UserType)
            }
            disabled={usersDisabled}
            className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
          >
            <option value="all">All Roles</option>
            <option value="SUPERVISOR">Supervisors</option>
            <option value="PICKER">Pickers</option>
          </select>
        </div>

        {/* User */}

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
            onChange={(event) => onUserChange(event.target.value)}
            disabled={usersDisabled}
            className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
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
            <p className="mt-1.5 text-xs text-[#777473]">Loading users...</p>
          )}

          {companyId === 'all' && (
            <p className="mt-1.5 text-xs text-[#777473]">
              Select a company to load users.
            </p>
          )}
        </div>

        {/* From Date */}

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
            onChange={(event) => onFromDateChange(event.target.value)}
            className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
          />
        </div>

        {/* To Date */}

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
            onChange={(event) => onToDateChange(event.target.value)}
            className="h-11 w-full cursor-pointer rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-[#393536] transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
          />
        </div>
      </div>

      {/* Information */}

      <div className="mt-5 rounded-md border border-[#ecebea] bg-[#fafafa] px-4 py-3">
        <p className="text-xs leading-5 text-[#6b6968]">
          {companyId === 'all'
            ? 'Select a company to load the available supervisors and pickers.'
            : usersLoaded
              ? `${filteredUsers.length} user${
                  filteredUsers.length === 1 ? '' : 's'
                } available for the selected filters.`
              : 'Loading users for the selected company...'}
        </p>
      </div>

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Action */}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching}
          className="h-11 cursor-pointer rounded-md bg-[#f14902] px-6 text-sm font-medium text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? 'Searching...' : 'Search Records'}
        </button>
      </div>
    </section>
  );
}
