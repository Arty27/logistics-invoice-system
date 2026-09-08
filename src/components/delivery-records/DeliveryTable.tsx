'use client';

import Table, { type TableColumn } from '@/components/Table';
import type { AdminRecord } from '@/types/delivery-records';

type DeliveryTableProps = {
  records: AdminRecord[];
  formatDateTime: (date: string | null) => string;
};

const Pill = ({ text }: { text: string }) => {
  return (
    <span className="inline-flex rounded-full bg-[#f3f3f2] px-2.5 py-1 text-xs font-medium text-[#5e5c5b]">
      {text}
    </span>
  );
};

export default function DeliveryTable({
  records,
  formatDateTime,
}: DeliveryTableProps) {
  const columns: TableColumn<AdminRecord>[] = [
    {
      key: 'type',
      header: 'Type',
      searchValue: (record) =>
        record.type === 'PACKLIST' ? 'Packlist' : 'Invoice Verification',
      render: (record) => (
        <Pill
          text={
            record.type === 'PACKLIST' ? 'Packlist' : 'Invoice Verification'
          }
        />
      ),
    },

    {
      key: 'company',
      header: 'Company',
      searchValue: (record) => record.company.name,
      render: (record) => record.company.name,
    },

    {
      key: 'user',
      header: 'User',
      searchValue: (record) => record.user.name,
      render: (record) => record.user.name,
    },

    {
      key: 'role',
      header: 'Role',
      searchValue: (record) =>
        record.user.role === 'SUPERVISOR' ? 'Supervisor' : 'Picker',
      render: (record) =>
        record.user.role === 'SUPERVISOR' ? 'Supervisor' : 'Picker',
    },

    {
      key: 'reference',
      header: 'Reference',
      searchValue: (record) =>
        record.type === 'INVOICE_VERIFICATION'
          ? (record.invoiceNumber ?? '')
          : (record.referenceNumber ?? ''),
      render: (record) =>
        record.type === 'INVOICE_VERIFICATION'
          ? (record.invoiceNumber ?? '-')
          : record.referenceNumber,
    },

    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      searchValue: (record) =>
        record.invoiceQuantity != null ? String(record.invoiceQuantity) : '',
      render: (record) => record.invoiceQuantity ?? '-',
    },

    {
      key: 'weight',
      header: 'Weight (Kg)',
      align: 'right',
      searchValue: (record) =>
        record.grossWeight != null ? String(record.grossWeight) : '',
      render: (record) => record.grossWeight ?? '-',
    },

    {
      key: 'status',
      header: 'Status',
      align: 'center',
      searchValue: (record) => record.status,
      render: (record) => record.status,
    },

    {
      key: 'completed',
      header: 'Completed',
      align: 'right',
      searchValue: (record) =>
        record.completedAt ? formatDateTime(record.completedAt) : '',
      render: (record) => formatDateTime(record.completedAt),
    },
  ];

  return (
    <Table
      columns={columns}
      data={records}
      getRowKey={(record) => record.id}
      emptyMessage="No records found"
      emptyDescription="There are no delivery records matching the selected filters."
      searchable
      searchPlaceholder="Search records..."
      pagination
    />
  );
}
