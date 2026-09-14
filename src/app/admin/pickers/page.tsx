'use client';

import { UserPlus, Users2Icon } from 'lucide-react';
import { useState } from 'react';

import AddMemberDialog from '@/components/pickers/AddMemberDialog';
import PickersResults from '@/components/pickers/PickerResults';
import ActionButton from '@/components/ActionButton';

import { usePickers } from '@/hooks/usePickers';

import type { UserRole } from '@/types/pickers';
import PageHeader from '@/components/PageHeader';

export default function AdminPickersPage() {
  const {
    pickers,
    companies,
    isLoading,
    isLoadingCompanies,
    isCreating,
    isUpdating,
    error,
    setError,
    loadCompanies,
    createUser,
    toggleUser,
  } = usePickers();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const openAddDialog = async () => {
    setError('');
    setShowAddDialog(true);

    /*
     * Refresh companies every time the dialog opens so
     * recently-created companies are available immediately.
     */
    await loadCompanies();
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f6] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl animate-[pageFadeIn_400ms_ease-out]">
        {/* HEADER */}

        <header className="mb-6 flex items-center justify-between gap-4">
          <PageHeader
            title={'Members'}
            description={'Manage users who enter packlist/invoice information.'}
            icon={<Users2Icon className="h-8 w-8 text-[#f14902]" />}
          />

          <ActionButton
            variant="primary"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={openAddDialog}
            className="shrink-0 px-4 sm:px-5"
          >
            <span className="hidden sm:inline">Add Member</span>

            <span className="sm:hidden">Add</span>
          </ActionButton>
        </header>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mb-6 animate-[errorIn_250ms_ease-out] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* RESULTS */}

        {isLoading ? (
          <section className="flex min-h-70 items-center justify-center rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
            <div className="flex items-center gap-2 text-sm text-[#777473]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d8d6d4] border-t-[#f14902]" />
              Loading members...
            </div>
          </section>
        ) : (
          <div className="animate-[resultsFadeIn_300ms_ease-out]">
            <PickersResults
              pickers={pickers}
              isUpdating={isUpdating}
              onToggle={toggleUser}
            />
          </div>
        )}
      </div>

      {/* ADD MEMBER DIALOG */}

      <AddMemberDialog
        open={showAddDialog}
        companies={companies}
        isLoadingCompanies={isLoadingCompanies}
        isCreating={isCreating}
        onClose={() => setShowAddDialog(false)}
        onSubmit={async (payload) =>
          createUser({
            ...payload,
            role: payload.role as UserRole,
          })
        }
      />

      <style jsx>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes resultsFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
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
    </main>
  );
}
