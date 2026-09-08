'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ActionButton from '@/components/ActionButton';

type CompanyDialogProps = {
  open: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
};

export default function CompanyDialog({
  open,
  isCreating,
  onClose,
  onSubmit,
}: CompanyDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) {
      setCompanyName('');
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

    const trimmedName = companyName.trim();

    if (!trimmedName) {
      setValidationError('Company name is required.');
      return;
    }

    setValidationError('');

    const created = await onSubmit(trimmedName);

    if (created) {
      setCompanyName('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[dialogBackdropIn_180ms_ease-out] items-center justify-center bg-[#393536]/30 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-company-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCreating) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md animate-[dialogIn_220ms_ease-out] rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_20px_60px_rgba(57,53,54,0.16)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-start justify-between gap-4 border-b border-[#eeecea] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#f14902]" />

            <div>
              <h2
                id="add-company-title"
                className="text-base font-semibold text-[#393536]"
              >
                Add Company
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#777473]">
                Create a company that can later be assigned to users.
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
          <div>
            <label
              htmlFor="company-name"
              className="mb-2 block text-sm font-medium text-[#393536]"
            >
              Company Name
            </label>

            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(event) => {
                setCompanyName(event.target.value);

                if (validationError) {
                  setValidationError('');
                }
              }}
              placeholder="Enter company name"
              autoFocus
              disabled={isCreating}
              className="h-11 w-full rounded-lg border border-[#d8d6d4] bg-white px-3 text-sm text-[#393536] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 outline-none placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:bg-[#f7f7f6]"
            />

            {validationError && (
              <p className="mt-2 text-xs text-red-600">{validationError}</p>
            )}
          </div>

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
              variant="primary"
              loading={isCreating}
              loadingText="Creating..."
              type="submit"
              className="sm:min-w-32.5"
            >
              Create Company
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
