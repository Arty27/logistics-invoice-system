'use client';

import { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';

import ActionButton from '@/components/ActionButton';
import type { Company, UserRole } from '@/types/pickers';

type AddMemberDialogProps = {
  open: boolean;
  companies: Company[];
  isLoadingCompanies: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    phoneNumber: string;
    password: string;
    companyId: string;
    role: UserRole;
  }) => Promise<boolean>;
};

export default function AddMemberDialog({
  open,
  companies,
  isLoadingCompanies,
  isCreating,
  onClose,
  onSubmit,
}: AddMemberDialogProps) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<UserRole>('PICKER');

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setPhoneNumber('');
      setPassword('');
      setCompanyId('');
      setRole('PICKER');
      setValidationError('');
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isCreating, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setValidationError('');

    if (!name.trim()) {
      setValidationError('Name is required.');
      return;
    }

    if (!phoneNumber) {
      setValidationError('Phone number is required.');
      return;
    }

    if (phoneNumber.length !== 10) {
      setValidationError('Phone number must contain exactly 10 digits.');
      return;
    }

    if (!password) {
      setValidationError('Password is required.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must contain at least 8 characters.');
      return;
    }

    if (!companyId) {
      setValidationError('Please select a company.');
      return;
    }

    const created = await onSubmit({
      name: name.trim(),
      phoneNumber,
      password,
      companyId,
      role,
    });

    if (created) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[dialogBackdropIn_180ms_ease-out] items-center justify-center bg-[#393536]/30 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCreating) {
          onClose();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl animate-[dialogIn_220ms_ease-out] overflow-y-auto rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_20px_60px_rgba(57,53,54,0.16)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-start justify-between gap-4 border-b border-[#eeecea] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f14902]/10">
              <UserPlus className="h-4 w-4 text-[#f14902]" />
            </div>

            <div>
              <h2
                id="add-member-title"
                className="text-base font-semibold text-[#393536]"
              >
                Add Member
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#777473]">
                Create a user and assign them to a company and role.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#777473] transition-all duration-150 hover:bg-[#f7f7f6] hover:text-[#393536] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}

            <div>
              <label
                htmlFor="member-name"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Name
              </label>

              <input
                id="member-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationError('');
                }}
                placeholder="Enter name"
                autoFocus
                disabled={isCreating}
                className="h-11 w-full rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] transition-all duration-200 outline-none placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              />
            </div>

            {/* Phone */}

            <div>
              <label
                htmlFor="member-phone"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Phone Number
              </label>

              <input
                id="member-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phoneNumber}
                onChange={(event) => {
                  const value = event.target.value;

                  if (/^\d*$/.test(value)) {
                    setPhoneNumber(value);
                    setValidationError('');
                  }
                }}
                placeholder="10-digit phone number"
                disabled={isCreating}
                className="h-11 w-full rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] transition-all duration-200 outline-none placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              />
            </div>

            {/* Company */}

            <div>
              <label
                htmlFor="member-company"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Company
              </label>

              <select
                id="member-company"
                value={companyId}
                onChange={(event) => {
                  setCompanyId(event.target.value);
                  setValidationError('');
                }}
                disabled={isLoadingCompanies || isCreating}
                className="h-11 w-full cursor-pointer rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] transition-all duration-200 outline-none hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
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

            {/* Role */}

            <div>
              <label
                htmlFor="member-role"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Role
              </label>

              <select
                id="member-role"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as UserRole);
                  setValidationError('');
                }}
                disabled={isCreating}
                className="h-11 w-full cursor-pointer rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] transition-all duration-200 outline-none hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              >
                <option value="PICKER">Picker</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Password */}

            <div className="sm:col-span-2">
              <label
                htmlFor="member-password"
                className="mb-2 block text-sm font-medium text-[#393536]"
              >
                Temporary Password
              </label>

              <input
                id="member-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setValidationError('');
                }}
                placeholder="Minimum 8 characters"
                disabled={isCreating}
                className="h-11 w-full rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] transition-all duration-200 outline-none placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
              />

              <p className="mt-1.5 text-xs text-[#777473]">
                The user can use this password to sign in.
              </p>
            </div>
          </div>

          {validationError && (
            <div
              role="alert"
              className="mt-5 animate-[errorIn_200ms_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {validationError}
            </div>
          )}

          {/* Actions */}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#eeecea] pt-5 sm:flex-row sm:justify-end">
            <ActionButton
              variant="secondary"
              onClick={onClose}
              disabled={isCreating}
              className="sm:min-w-22.5"
            >
              Cancel
            </ActionButton>

            <ActionButton
              type="submit"
              variant="primary"
              loading={isCreating}
              loadingText="Creating..."
              disabled={isLoadingCompanies || companies.length === 0}
              className="sm:min-w-32.5"
            >
              Create User
            </ActionButton>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes dialogBackdropIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes dialogIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
    </div>
  );
}
