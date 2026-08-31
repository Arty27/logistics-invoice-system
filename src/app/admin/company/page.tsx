'use client';

import Loading from '@/components/Loading';
import { FormEvent, useEffect, useState } from 'react';

type Company = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CompaniesResponse = {
  success?: boolean;
  error?: string;
  data?: Company[];
};

type CompanyResponse = {
  success?: boolean;
  error?: string;
  company?: Company;
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);

  const [companyName, setCompanyName] = useState('');

  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingName, setEditingName] = useState('');

  /*
   * ---------------------------------------------------------
   * Load companies
   * ---------------------------------------------------------
   */
  async function loadCompanies() {
    setError('');
    setIsLoading(true);

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

      setCompanies(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  /*
   * ---------------------------------------------------------
   * Create company
   * ---------------------------------------------------------
   */
  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    const trimmedName = companyName.trim();

    if (!trimmedName) {
      setError('Company name is required.');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data: CompanyResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create company.');
        return;
      }

      setCompanyName('');
      setShowAddForm(false);

      await loadCompanies();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsCreating(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Start editing
   * ---------------------------------------------------------
   */
  function startEditing(company: Company) {
    setError('');
    setEditingCompany(company);
    setEditingName(company.name);
  }

  /*
   * ---------------------------------------------------------
   * Cancel editing
   * ---------------------------------------------------------
   */
  function cancelEditing() {
    if (isUpdating) {
      return;
    }

    setEditingCompany(null);
    setEditingName('');
  }

  /*
   * ---------------------------------------------------------
   * Update company name
   * ---------------------------------------------------------
   */
  async function handleUpdateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCompany) {
      return;
    }

    setError('');

    const trimmedName = editingName.trim();

    if (!trimmedName) {
      setError('Company name is required.');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data: CompanyResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to update company.');
        return;
      }

      if (data.company) {
        setCompanies((current) =>
          current.map((company) =>
            company.id === data.company!.id ? data.company! : company,
          ),
        );
      }

      setEditingCompany(null);
      setEditingName('');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsUpdating(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * Activate / deactivate company
   * ---------------------------------------------------------
   */
  async function toggleCompany(company: Company) {
    setError('');

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !company.isActive,
        }),
      });

      const data: CompanyResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to update company.');
        return;
      }

      if (data.company) {
        setCompanies((current) =>
          current.map((item) =>
            item.id === data.company!.id ? data.company! : item,
          ),
        );
      }
    } catch {
      setError('Unable to connect to the server.');
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* --------------------------------------------------- */}
      {/* Header */}
      {/* --------------------------------------------------- */}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#393536]">Companies</h1>

          <p className="mt-1 text-sm text-[#6b6968]">
            Manage companies assigned to warehouse users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setShowAddForm((current) => !current);
          }}
          className="h-10 shrink-0 rounded-md bg-[#f14902] px-5 text-sm font-medium text-white transition hover:bg-[#d94000]"
        >
          {showAddForm ? 'Cancel' : 'Add Company'}
        </button>
      </div>

      {/* --------------------------------------------------- */}
      {/* Error */}
      {/* --------------------------------------------------- */}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* Add Company */}
      {/* --------------------------------------------------- */}

      {showAddForm && (
        <section className="mb-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-6 py-5">
            <h2 className="text-sm font-semibold text-[#393536]">
              Add Company
            </h2>

            <p className="mt-1 text-xs text-[#777473]">
              Create a company that can later be assigned to users.
            </p>
          </div>

          <form
            onSubmit={handleCreateCompany}
            className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="companyName"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Company Name
              </label>

              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Enter company name"
                required
                autoFocus
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm text-black transition outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="h-11 rounded-md bg-[#f14902] px-5 text-sm font-medium text-white transition hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </section>
      )}

      {/* --------------------------------------------------- */}
      {/* Companies */}
      {/* --------------------------------------------------- */}

      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <p className="text-sm font-semibold text-[#393536]">
            {companies.length}{' '}
            {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>

        {isLoading ? (
          <Loading />
        ) : companies.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[#6b6968]">
              No companies have been added yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Company
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Created
                  </th>

                  <th className="px-5 py-3 font-bold text-[#393536]">Status</th>

                  <th className="px-5 py-3 text-right font-bold text-[#393536]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company) => {
                  const isEditing = editingCompany?.id === company.id;

                  return (
                    <tr
                      key={company.id}
                      className="border-b border-[#eeecea] last:border-0"
                    >
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <form
                            onSubmit={handleUpdateCompany}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editingName}
                              onChange={(event) =>
                                setEditingName(event.target.value)
                              }
                              autoFocus
                              disabled={isUpdating}
                              className="h-10 w-full max-w-sm rounded-md border border-[#cfcfcd] px-3 text-sm text-black outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
                            />

                            <button
                              type="submit"
                              disabled={isUpdating}
                              className="h-10 rounded-md bg-[#f14902] px-4 text-xs font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={isUpdating}
                              className="h-10 rounded-md border border-[#cfcfcd] px-4 text-xs font-medium text-[#393536] hover:bg-[#f7f7f6] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <span className="font-medium text-[#393536]">
                            {company.name}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-[#555251]">
                        {new Date(company.createdAt).toLocaleDateString(
                          'en-IN',
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            company.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {!isEditing && (
                          <div className="flex items-center justify-end gap-4">
                            <button
                              type="button"
                              onClick={() => startEditing(company)}
                              className="cursor-pointer text-sm font-medium text-[#393536] hover:text-[#f14902]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCompany(company)}
                              className="cursor-pointer text-sm font-medium text-[#393536] hover:text-[#f14902]"
                            >
                              {company.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
