'use client';

import Loading from '@/components/Loading';
import { FormEvent, useEffect, useState } from 'react';

type UserRole = 'ADMIN' | 'SUPERVISOR' | 'PICKER';

type Company = {
  id: string;
  name: string;
  isActive?: boolean;
};

type Picker = {
  id: string;
  name: string;
  company: {
    id: string;
    name: string;
  } | null;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

type CompaniesResponse = {
  error?: string;
  data?: Company[];
};

export default function AdminPickersPage() {
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<UserRole>('PICKER');

  /*
   * ---------------------------------------------------------
   * Load existing pickers
   * ---------------------------------------------------------
   */
  async function loadPickers() {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load pickers.');
        return;
      }

      setPickers(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Load companies
   * ---------------------------------------------------------
   *
   * Currently assumes:
   *
   * GET /api/companies
   *
   * We can change this when we update the backend API.
   */
  async function loadCompanies() {
    setError('');
    setIsLoadingCompanies(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'GET',
        cache: 'no-store',
      });

      const data: CompaniesResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load companies.');
        return;
      }

      setCompanies(
        (data.data ?? []).filter((company) => company.isActive !== false),
      );
    } catch {
      setError('Unable to load companies.');
    } finally {
      setIsLoadingCompanies(false);
    }
  }

  useEffect(() => {
    loadPickers();
    loadCompanies();
  }, []);

  /*
   * ---------------------------------------------------------
   * Reset add form
   * ---------------------------------------------------------
   */
  function resetForm() {
    setName('');
    setPhoneNumber('');
    setPassword('');
    setCompanyId('');
    setRole('PICKER');
  }

  /*
   * ---------------------------------------------------------
   * Create picker/user
   * ---------------------------------------------------------
   */
  async function handleCreatePicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!companyId) {
      setError('Please select a company.');
      return;
    }

    if (!role) {
      setError('Please select a role.');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phoneNumber,
          password,

          /*
           * New fields.
           */
          companyId,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to create user.');
        } else {
          setError(data.error ?? 'Unable to create user.');
        }

        return;
      }

      resetForm();
      setShowAddForm(false);

      await loadPickers();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsCreating(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Activate / deactivate user
   * ---------------------------------------------------------
   */
  async function togglePicker(picker: Picker) {
    setError('');

    try {
      const response = await fetch(`/api/users/${picker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !picker.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to update user.');
        return;
      }

      setPickers((current) =>
        current.map((item) =>
          item.id === picker.id
            ? {
                ...item,
                isActive: data.user.isActive,
              }
            : item,
        ),
      );
    } catch {
      setError('Unable to connect to the server.');
    }
  }

  /*
   * ---------------------------------------------------------
   * Role label
   * ---------------------------------------------------------
   */
  function getRoleLabel(role: UserRole) {
    switch (role) {
      case 'ADMIN':
        return 'Admin';

      case 'SUPERVISOR':
        return 'Supervisor';

      case 'PICKER':
        return 'Picker';

      default:
        return role;
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* =====================================================
          HEADER
          ===================================================== */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#393536]">Pickers</h1>

          <p className="mt-1 text-sm text-[#6b6968]">
            Manage users who enter packlist information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');

            if (!showAddForm) {
              /*
               * Reload companies when opening the form
               * in case a company was recently added.
               */
              loadCompanies();
            }

            setShowAddForm((current) => !current);
          }}
          className="h-10 shrink-0 cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000]"
        >
          {showAddForm ? 'Cancel' : 'Add Members'}
        </button>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* =====================================================
          ADD USER FORM
          ===================================================== */}
      {showAddForm && (
        <section className="mb-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-6 py-5">
            <h2 className="text-sm font-semibold text-[#393536]">Add User</h2>

            <p className="mt-1 text-xs text-[#777473]">
              Create a user and assign them to a company and role.
            </p>
          </div>

          <form
            onSubmit={handleCreatePicker}
            className="grid gap-5 px-6 py-6 sm:grid-cols-2"
          >
            {/* =================================================
                NAME
                ================================================= */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Enter name"
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            {/* =================================================
                PHONE NUMBER
                ================================================= */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Phone number
              </label>

              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phoneNumber}
                onChange={(event) => {
                  const value = event.target.value;

                  if (/^\d*$/.test(value)) {
                    setPhoneNumber(value);
                  }
                }}
                required
                placeholder="Enter phone number"
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

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
                onChange={(event) => setCompanyId(event.target.value)}
                required
                disabled={isLoadingCompanies}
                className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              >
                <option value="">
                  {isLoadingCompanies
                    ? 'Loading companies...'
                    : 'Select company'}
                </option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>

              {!isLoadingCompanies && companies.length === 0 && (
                <p className="mt-1.5 text-xs text-red-600">
                  No active companies available.
                </p>
              )}
            </div>

            {/* =================================================
                ROLE
                ================================================= */}
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Role
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                required
                className="h-11 w-full rounded-md border border-[#cfcfcd] bg-white px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              >
                <option value="PICKER">Picker</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* =================================================
                PASSWORD
                ================================================= */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Temporary password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            {/* =================================================
                SUBMIT
                ================================================= */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={
                  isCreating || isLoadingCompanies || companies.length === 0
                }
                className="h-11 w-full cursor-pointer rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isCreating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =====================================================
          USERS TABLE
          ===================================================== */}
      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <p className="text-sm font-semibold text-[#393536]">
            {pickers.length} {pickers.length === 1 ? 'user' : 'users'}
          </p>
        </div>

        {isLoading ? (
          <Loading />
        ) : pickers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[#6b6968]">
              No users have been added yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">Name</th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Phone Number
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Company
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">Role</th>

                  <th className="px-5 py-3 font-bold text-[#393536]">Status</th>

                  <th className="px-5 py-3 text-right font-medium text-[#393536]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {pickers.map((picker) => (
                  <tr
                    key={picker.id}
                    className="border-b border-[#eeecea] last:border-0"
                  >
                    {/* NAME */}
                    <td className="px-5 py-4 font-medium text-[#393536]">
                      {picker.name}
                    </td>

                    {/* PHONE */}
                    <td className="px-5 py-4 text-[#555251]">
                      {picker.phoneNumber}
                    </td>

                    {/* COMPANY */}
                    <td className="px-5 py-4 text-[#555251]">
                      {picker.company?.name ?? 'Not assigned'}
                    </td>

                    {/* ROLE */}
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-[#f7f7f6] px-2.5 py-1 text-xs font-medium text-[#555251]">
                        {getRoleLabel(picker.role)}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          picker.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {picker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => togglePicker(picker)}
                        className="cursor-pointer text-sm font-medium text-[#393536] hover:text-[#f14902]"
                      >
                        {picker.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
