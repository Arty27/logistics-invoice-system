'use client';

import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';

import CompanyDialog from '@/components/companies/CompanyDialog';
import CompaniesResults from '@/components/companies/CompanyResults';
import ActionButton from '@/components/ActionButton';
import { useCompanies } from '@/hooks/useCompanies';
import PageHeader from '@/components/PageHeader';

export default function AdminCompaniesPage() {
  const {
    companies,
    isLoading,
    isCreating,
    isUpdating,
    error,
    setError,
    createCompany,
    updateCompany,
  } = useCompanies();

  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f6] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl animate-[pageFadeIn_400ms_ease-out]">
        {/* HEADER */}

        <header className="mb-6 flex items-center justify-between gap-4">
          <PageHeader
            title="Companies"
            description="Manage companies assigned to warehouse users."
            icon={<Building2 className="h-8 w-8 text-[#f14902]" />}
          />

          <ActionButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setError('');
              setShowAddDialog(true);
            }}
            className="shrink-0 px-4 sm:px-5"
          >
            <span className="hidden sm:inline">Add Company</span>
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
              Loading companies...
            </div>
          </section>
        ) : (
          <div className="animate-[resultsFadeIn_300ms_ease-out]">
            <CompaniesResults
              companies={companies}
              isUpdating={isUpdating}
              onUpdate={updateCompany}
            />
          </div>
        )}
      </div>

      {/* ADD COMPANY DIALOG */}

      <CompanyDialog
        open={showAddDialog}
        isCreating={isCreating}
        onClose={() => setShowAddDialog(false)}
        onSubmit={createCompany}
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
