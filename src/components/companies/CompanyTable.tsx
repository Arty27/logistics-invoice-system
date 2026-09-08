'use client';

import { Check, Edit2, Power, X } from 'lucide-react';
import { useState } from 'react';

import Table, { type TableColumn } from '@/components/Table';
import ActionButton from '@/components/ActionButton';
import type { Company } from '@/types/companies';
import { Tooltip } from '@mui/material';

type CompanyTableProps = {
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

export default function CompanyTable({
  companies,
  isUpdating,
  onUpdate,
}: CompanyTableProps) {
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const [editingName, setEditingName] = useState('');

  const startEditing = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditingName(company.name);
  };

  const cancelEditing = () => {
    if (isUpdating) {
      return;
    }

    setEditingCompanyId(null);
    setEditingName('');
  };

  const saveEditing = async () => {
    if (!editingCompanyId) {
      return;
    }

    const trimmedName = editingName.trim();

    if (!trimmedName) {
      return;
    }

    const updated = await onUpdate(editingCompanyId, {
      name: trimmedName,
    });

    if (updated) {
      setEditingCompanyId(null);
      setEditingName('');
    }
  };

  const handleToggle = async (company: Company) => {
    await onUpdate(company.id, {
      isActive: !company.isActive,
    });
  };

  const columns: TableColumn<Company>[] = [
    {
      key: 'name',
      header: 'Company',
      searchValue: (company) => company.name,
      render: (company) => {
        const isEditing = editingCompanyId === company.id;

        if (isEditing) {
          return (
            <div className="flex min-w-70 items-center gap-2">
              <input
                type="text"
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    saveEditing();
                  }

                  if (event.key === 'Escape') {
                    cancelEditing();
                  }
                }}
                autoFocus
                disabled={isUpdating}
                className="h-10 w-full max-w-sm rounded-lg border border-[#d8d6d4] px-3 text-sm text-[#393536] transition-all duration-200 outline-none focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10 disabled:bg-[#f7f7f6]"
              />

              <button
                type="button"
                onClick={saveEditing}
                disabled={isUpdating}
                aria-label="Save company"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#f14902] text-white transition-all duration-150 hover:bg-[#d94000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={isUpdating}
                aria-label="Cancel editing"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d8d6d4] text-[#777473] transition-all duration-150 hover:bg-[#f7f7f6] hover:text-[#393536] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        }

        return (
          <span className="font-medium text-[#393536]">{company.name}</span>
        );
      },
    },

    {
      key: 'createdAt',
      header: 'Created',
      searchValue: (company) =>
        new Date(company.createdAt).toLocaleDateString('en-IN'),
      render: (company) => (
        <span className="text-[#555251]">
          {new Date(company.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },

    {
      key: 'status',
      header: 'Status',
      align: 'center',
      searchValue: (company) => (company.isActive ? 'Active' : 'Inactive'),
      render: (company) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            company.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-[#f3f3f2] text-[#6b6968]'
          }`}
        >
          {company.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },

    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (company) => {
        const isEditing = editingCompanyId === company.id;

        if (isEditing) {
          return null;
        }

        return (
          <div className="flex items-center justify-end gap-1">
            <Tooltip title="Edit">
              <button
                type="button"
                onClick={() => startEditing(company)}
                aria-label={`Edit ${company.name}`}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-lg text-[#777473] transition-all duration-150 hover:bg-[#f7f7f6] hover:text-[#f14902]"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip title="Deactivate">
              <button
                type="button"
                onClick={() => handleToggle(company)}
                disabled={isUpdating}
                aria-label={
                  company.isActive
                    ? `Deactivate ${company.name}`
                    : `Activate ${company.name}`
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#777473] transition-all duration-150 hover:bg-[#f7f7f6] hover:text-[#f14902] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Power className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={companies}
      getRowKey={(company) => company.id}
      searchable
      searchPlaceholder="Search companies..."
      pagination
      pageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      emptyMessage="No companies found"
      emptyDescription="There are no companies matching your search."
    />
  );
}
