'use client';

import { Packlist, Picker } from '@/types/Packlist';

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-IN');
}

function getStatusLabel(status: Packlist['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'Active';

    case 'COMPLETED':
      return 'Completed';

    case 'LEGACY':
      return 'Legacy';

    default:
      return status;
  }
}

function getStatusClasses(status: Packlist['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'border-green-200 bg-green-50 text-green-700';

    case 'COMPLETED':
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'LEGACY':
      return 'border-gray-200 bg-gray-50 text-gray-600';

    default:
      return 'border-gray-200 bg-gray-50 text-gray-600';
  }
}

function getPickerNames(pickers: Picker[]) {
  if (pickers.length === 0) {
    return '—';
  }

  return pickers.map((picker) => picker.name).join(', ');
}

type PacklistTableProps = {
  records: Packlist[];
};
export default function PacklistTable({ records }: PacklistTableProps) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-[#dedddb] bg-white shadow-sm">
        <div className="border-b border-[#e5e4e2] px-5 py-4">
          <p className="text-sm font-medium text-[#393536]">
            {records.length} record
            {records.length === 1 ? '' : 's'}
          </p>
        </div>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#dedddb] bg-[#f7f7f6]">
              <tr>
                <th className="px-5 py-3 font-bold text-[#393536]">
                  Packlist No.
                </th>

                <th className="px-5 py-3 font-bold text-[#393536]">
                  Invoice Qty
                </th>

                <th className="px-5 py-3 font-bold text-[#393536]">
                  Gross Weight
                </th>

                <th className="px-5 py-3 font-bold text-[#393536]">Status</th>

                <th className="px-5 py-3 font-bold text-[#393536]">Started</th>

                <th className="px-5 py-3 font-bold text-[#393536]">
                  Completed
                </th>

                <th className="px-5 py-3 font-bold text-[#393536]">Pickers</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-[#eeecea] last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-[#393536]">
                    {record.packlistNumber}
                  </td>

                  <td className="px-5 py-3 text-[#555251]">
                    {record.invoiceQuantity}
                  </td>

                  <td className="px-5 py-3 text-[#555251]">
                    {record.grossWeight} kg
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                        record.status,
                      )}`}
                    >
                      {getStatusLabel(record.status)}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-[#6b6968]">
                    {formatDateTime(record.startedAt)}
                  </td>

                  <td className="px-5 py-3 text-[#6b6968]">
                    {formatDateTime(record.completedAt)}
                  </td>

                  <td className="px-5 py-3 text-[#555251]">
                    {getPickerNames(record.pickers)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-[#eeecea] md:hidden">
          {records.map((record) => (
            <div key={record.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-[#393536]">
                    {record.packlistNumber}
                  </p>

                  <p className="mt-1 text-xs text-[#777473]">Packlist</p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                    record.status,
                  )}`}
                >
                  {getStatusLabel(record.status)}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#777473]">Invoice Quantity</p>

                  <p className="mt-1 text-sm font-medium text-[#393536]">
                    {record.invoiceQuantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777473]">Gross Weight</p>

                  <p className="mt-1 text-sm font-medium text-[#393536]">
                    {record.grossWeight} kg
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs text-[#777473]">Started</p>

                  <p className="mt-1 text-sm text-[#555251]">
                    {formatDateTime(record.startedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#777473]">Completed</p>

                  <p className="mt-1 text-sm text-[#555251]">
                    {formatDateTime(record.completedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-[#eeecea] pt-4">
                <p className="text-xs text-[#777473]">Pickers</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {record.pickers.length > 0 ? (
                    record.pickers.map((picker) => (
                      <span
                        key={picker.id}
                        className="rounded-full bg-[#f7f7f6] px-2.5 py-1 text-xs text-[#555251]"
                      >
                        {picker.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#777473]">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
