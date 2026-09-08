'use client';

import { Loader2, Search } from 'lucide-react';
import type { Company, User, UserType } from '@/types/delivery-records';
import ActionButton from '../ActionButton';

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

  const inputClasses =
    'h-11 w-full cursor-pointer rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200 placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:border-[#e3e1df] disabled:bg-[#f7f7f6] disabled:text-[#aaa8a6]';

  return (
    <section className="rounded-2xl border border-[#e5e3e1] bg-white p-5 shadow-[0_4px_20px_rgba(57,53,54,0.04)] transition-shadow duration-200 sm:p-6">
      {/* Header */}

      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-[#f14902]" />

          <h2 className="text-base font-semibold tracking-tight text-[#393536]">
            Filters
          </h2>
        </div>

        <p className="mt-1.5 text-sm leading-5 text-[#777473]">
          Select a company first, then narrow the records by user.
        </p>
      </div>

      {/* Filters */}

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
            className={inputClasses}
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
            className={inputClasses}
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
            className={inputClasses}
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
            <p className="mt-1.5 animate-[fadeIn_200ms_ease-out] text-xs text-[#777473]">
              Loading users...
            </p>
          )}

          {companyId === 'all' && (
            <p className="mt-1.5 animate-[fadeIn_200ms_ease-out] text-xs text-[#777473]">
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
            className={inputClasses}
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
            className={inputClasses}
          />
        </div>
      </div>

      {/* Information */}

      <div className="mt-6 rounded-xl border border-[#ebe9e7] bg-[#faf9f8] px-4 py-3.5 transition-colors duration-200">
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
          className="mt-5 animate-[errorIn_250ms_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Action */}

      <div className="mt-6 flex flex-col gap-3 border-t border-[#eeecea] pt-5 sm:flex-row sm:justify-end">
        <ActionButton
          variant="primary"
          icon={<Search className="h-4 w-4" />}
          onClick={onSearch}
          loading={isSearching}
          loadingText="Searching..."
        >
          Search Records
        </ActionButton>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes errorIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
