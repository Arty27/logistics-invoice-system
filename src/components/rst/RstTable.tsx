'use client';

import Table, { type TableColumn } from '@/components/Table';
import type { RstEntry } from '@/types/rst';

type RstTableProps = {
  entries: RstEntry[];
  formatDateTime: (date: string | null) => string;
};

export default function RstTable({ entries, formatDateTime }: RstTableProps) {
  const columns: TableColumn<RstEntry>[] = [
    {
      key: 'company',
      header: 'Company',
      searchValue: (entry) => entry.companyName,
      render: (entry) => (
        <span className="font-medium text-[#393536]">{entry.companyName}</span>
      ),
    },

    {
      key: 'skuCode',
      header: 'SKU Code',
      searchValue: (entry) => entry.skuCode,
      render: (entry) => (
        <span className="font-medium text-[#393536]">{entry.skuCode}</span>
      ),
    },

    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      searchValue: (entry) => String(entry.quantity),
      render: (entry) => (
        <span className="text-[#555251]">
          {entry.quantity.toLocaleString('en-IN')}
        </span>
      ),
    },

    {
      key: 'enteredBy',
      header: 'Entered By',
      searchValue: (entry) => entry.enteredBy.name,
      render: (entry) => (
        <span className="text-[#555251]">{entry.enteredBy.name}</span>
      ),
    },

    {
      key: 'enteredAt',
      header: 'Entered At',
      searchValue: (entry) =>
        entry.enteredAt ? formatDateTime(entry.enteredAt) : '',
      render: (entry) => (
        <span className="text-[#6b6968]">
          {formatDateTime(entry.enteredAt)}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={entries}
      getRowKey={(entry) => entry.id}
      searchable
      searchPlaceholder="Search records..."
      pagination
      pageSize={25}
      pageSizeOptions={[10, 25, 50, 100]}
      emptyMessage="No RST entries found"
      emptyDescription="There are no rolling stock entries matching the selected filters."
    />
  );
}
