'use client';

import { Power } from 'lucide-react';

import Table, { type TableColumn } from '@/components/Table';

import type { Picker, UserRole } from '@/types/pickers';

type PickerTableProps = {
  pickers: Picker[];
  isUpdating: boolean;
  onToggle: (picker: Picker) => Promise<boolean>;
};

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

export default function PickerTable({
  pickers,
  isUpdating,
  onToggle,
}: PickerTableProps) {
  const columns: TableColumn<Picker>[] = [
    {
      key: 'name',
      header: 'Name',
      searchValue: (picker) => picker.name,
      render: (picker) => (
        <span className="font-medium text-[#393536]">{picker.name}</span>
      ),
    },

    {
      key: 'phoneNumber',
      header: 'Phone Number',
      searchValue: (picker) => picker.phoneNumber,
      render: (picker) => (
        <span className="text-[#555251]">{picker.phoneNumber}</span>
      ),
    },

    {
      key: 'company',
      header: 'Company',
      searchValue: (picker) => picker.company?.name ?? '',
      render: (picker) => (
        <span className="text-[#555251]">
          {picker.company?.name ?? 'Not assigned'}
        </span>
      ),
    },

    {
      key: 'role',
      header: 'Role',
      searchValue: (picker) => getRoleLabel(picker.role),
      render: (picker) => (
        <span className="inline-flex rounded-full bg-[#f3f3f2] px-2.5 py-1 text-xs font-medium text-[#5e5c5b]">
          {getRoleLabel(picker.role)}
        </span>
      ),
    },

    {
      key: 'status',
      header: 'Status',
      align: 'center',
      searchValue: (picker) => (picker.isActive ? 'Active' : 'Inactive'),
      render: (picker) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            picker.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-[#f3f3f2] text-[#6b6968]'
          }`}
        >
          {picker.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },

    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (picker) => (
        <button
          type="button"
          onClick={() => onToggle(picker)}
          disabled={isUpdating}
          aria-label={
            picker.isActive
              ? `Deactivate ${picker.name}`
              : `Activate ${picker.name}`
          }
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#777473] transition-all duration-150 hover:bg-[#f7f7f6] hover:text-[#f14902] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Power className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={pickers}
      getRowKey={(picker) => picker.id}
      searchable
      searchPlaceholder="Search members..."
      pagination
      pageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      emptyMessage="No members found"
      emptyDescription="There are no members matching your search."
    />
  );
}
