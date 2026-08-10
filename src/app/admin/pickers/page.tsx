'use client';

import { FormEvent, useEffect, useState } from 'react';

type Picker = {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPickersPage() {
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  async function loadPickers() {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users');

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load pickers.');
        return;
      }

      setPickers(data.data);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPickers();
  }, []);

  async function handleCreatePicker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to create picker.');
        } else {
          setError(data.error ?? 'Unable to create picker.');
        }

        return;
      }

      setName('');
      setPhoneNumber('');
      setPassword('');
      setShowAddForm(false);

      await loadPickers();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsCreating(false);
    }
  }

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
        setError(data.error ?? 'Unable to update picker.');
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
            setShowAddForm((current) => !current);
          }}
          className="h-10 shrink-0 rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000]"
        >
          {showAddForm ? 'Cancel' : 'Add Picker'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {showAddForm && (
        <section className="mb-6 rounded-lg border border-[#dedddb] bg-white shadow-sm">
          <div className="border-b border-[#e5e4e2] px-6 py-5">
            <h2 className="text-sm font-semibold text-[#393536]">Add Picker</h2>
          </div>

          <form
            onSubmit={handleCreatePicker}
            className="grid gap-5 px-6 py-6 sm:grid-cols-2"
          >
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
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

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
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

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
                className="h-11 w-full rounded-md border border-[#cfcfcd] px-3 text-sm outline-none focus:border-[#f14902] focus:ring-2 focus:ring-[#f14902]/15"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isCreating}
                className="h-11 w-full rounded-md bg-[#f14902] px-5 text-sm font-medium text-white hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isCreating ? 'Creating...' : 'Create Picker'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-6 py-5">
          <p className="text-sm font-semibold text-[#393536]">
            {pickers.length} {pickers.length === 1 ? 'picker' : 'pickers'}
          </p>
        </div>

        {isLoading ? (
          <div className="px-6 py-10">
            <p className="text-sm text-[#6b6968]">Loading pickers...</p>
          </div>
        ) : pickers.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[#6b6968]">
              No pickers have been added yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
                <tr>
                  <th className="px-5 py-3 font-bold text-[#393536]">Name</th>

                  <th className="px-5 py-3 font-bold text-[#393536]">
                    Phone Number
                  </th>

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
                    <td className="px-5 py-4 font-medium text-[#393536]">
                      {picker.name}
                    </td>

                    <td className="px-5 py-4 text-[#555251]">
                      {picker.phoneNumber}
                    </td>

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

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => togglePicker(picker)}
                        className="text-sm font-medium text-[#393536] hover:text-[#f14902]"
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
