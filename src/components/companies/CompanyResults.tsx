'use client';

import { Building2 } from 'lucide-react';

import CompanyTable from '@/components/companies/CompanyTable';
import type { Company } from '@/types/companies';

type CompaniesResultsProps = {
  companies: Company[];
  isUpdating: boolean;
  onUpdate: (
    companyId: string,
    updates: {
      name?: string;
      isActive?: boolean;
    },
  ) => Promise<boolean>;
};

export default function CompaniesResults({
  companies,
  isUpdating,
  onUpdate,
}: CompaniesResultsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
      <CompanyTable
        companies={companies}
        isUpdating={isUpdating}
        onUpdate={onUpdate}
      />
    </section>
  );
}
