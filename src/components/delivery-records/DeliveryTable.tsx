'use client';

import type { AdminRecord } from '@/types/delivery-records';

type DeliveryTableProps = {
  records: AdminRecord[];
  formatDateTime: (date: string | null) => string;
};

export default function DeliveryTable({
  records,
  formatDateTime,
}: DeliveryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-275 border-collapse">
        <thead>
          <tr className="border-b border-[#dedddb] bg-[#fafafa]">
            <TableHeader>Type</TableHeader>
            <TableHeader>Company</TableHeader>
            <TableHeader>User</TableHeader>
            <TableHeader>Reference</TableHeader>
            <TableHeader align="right">Quantity</TableHeader>
            <TableHeader align="right">Weight (kg)</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Completed</TableHeader>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <DeliveryTableRow
              key={`${record.type}-${record.id}`}
              record={record}
              formatDateTime={formatDateTime}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const alignmentClass = align === 'right' ? 'text-right' : 'text-left';

  return (
    <th
      className={`px-4 py-3 ${alignmentClass} text-xs font-semibold tracking-wide text-[#6b6968] uppercase`}
    >
      {children}
    </th>
  );
}

function DeliveryTableRow({
  record,
  formatDateTime,
}: {
  record: AdminRecord;
  formatDateTime: (date: string | null) => string;
}) {
  const isInvoice = record.type === 'INVOICE_VERIFICATION';

  const reference = isInvoice
    ? (record.invoiceNumber ?? record.referenceNumber)
    : record.referenceNumber;

  return (
    <tr className="border-b border-[#ecebea] last:border-b-0 hover:bg-[#fafafa]">
      <td className="px-4 py-4 text-sm text-[#393536]">
        <span className="inline-flex rounded-full bg-[#f3f3f2] px-2.5 py-1 text-xs font-medium text-[#5e5c5b]">
          {isInvoice ? 'Invoice' : 'Packlist'}
        </span>
      </td>

      <td className="px-4 py-4 text-sm text-[#393536]">
        {record.company.name}
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-medium text-[#393536]">{record.user.name}</p>

        <p className="mt-0.5 text-xs text-[#777473]">
          {record.user.role === 'SUPERVISOR' ? 'Supervisor' : 'Picker'}
        </p>
      </td>

      <td className="px-4 py-4 text-sm font-medium text-[#393536]">
        {reference}
      </td>

      <td className="px-4 py-4 text-right text-sm text-[#393536]">
        {record.invoiceQuantity}
      </td>

      <td className="px-4 py-4 text-right text-sm text-[#393536]">
        {record.grossWeight}
      </td>

      <td className="px-4 py-4 text-sm text-[#393536]">{record.status}</td>

      <td className="px-4 py-4 text-sm text-[#6b6968]">
        {formatDateTime(record.completedAt)}
      </td>
    </tr>
  );
}
