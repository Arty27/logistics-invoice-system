import { formatDuration, getDate, getTime } from '@/lib/functions';
import { ExcelColumn } from '../types';

export type DeliveryRecord = {
  id: string;
  type: 'PACKLIST' | 'INVOICE_VERIFICATION';
  company: {
    name: string;
  };
  user: {
    name: string;
    role: 'SUPERVISOR' | 'PICKER';
  };
  referenceNumber: string;
  invoiceNumber?: string | null;
  invoiceQuantity?: number | string | null;
  dispatchedQuantity?: number | string | null;
  grossWeight?: number | string | null;
  dispatchedWeight?: number | string | null;
  result?: string | null;
  remarks?: string | null;
  status?: string | null;
  duration?: number | string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export const deliveryRecordColumns: ExcelColumn<DeliveryRecord>[] = [
  {
    key: 'type',
    header: 'Type',
    type: 'text',
    width: 25,
    value: (record) =>
      record.type === 'INVOICE_VERIFICATION'
        ? 'Invoice Verification'
        : 'Packlist',
  },

  {
    key: 'company',
    header: 'Company',
    type: 'text',
    width: 25,
    value: (record) => record.company?.name ?? '',
  },

  {
    key: 'user',
    header: 'User',
    type: 'text',
    width: 25,
    value: (record) => record.user?.name ?? '',
  },

  {
    key: 'role',
    header: 'Role',
    type: 'text',
    width: 18,
    value: (record) => record.user?.role ?? '',
  },

  {
    key: 'reference',
    header: 'Reference / Invoice',
    type: 'text',
    width: 25,
    value: (record) => record.invoiceNumber || record.referenceNumber || '',
  },

  {
    key: 'invoiceQuantity',
    header: 'Invoiced Quantity',
    type: 'number',
    width: 20,
    numFmt: '#,##0.00',
    value: (record) => record.invoiceQuantity,
  },

  {
    key: 'dispatchedQuantity',
    header: 'Dispatched Quantity',
    type: 'number',
    width: 22,
    numFmt: '#,##0.00',
    value: (record) => record.dispatchedQuantity,
  },

  {
    key: 'invoiceWeight',
    header: 'Invoiced Weight (kg)',
    type: 'number',
    width: 20,
    value: (record) => record.grossWeight,
  },

  {
    key: 'dispatchedWeight',
    header: 'Dispatched Weight (kg)',
    type: 'number',
    width: 22,
    value: (record) => record.dispatchedWeight,
  },

  {
    key: 'result',
    header: 'Result',
    type: 'text',
    width: 18,
    value: (record) => record.result ?? '',
  },

  {
    key: 'remarks',
    header: 'Remarks',
    type: 'text',
    width: 35,
    value: (record) => record.remarks ?? '',
  },

  {
    key: 'status',
    header: 'Status',
    type: 'text',
    width: 18,
    value: (record) => record.status ?? '',
  },

  {
    key: 'duration',
    header: 'Duration',
    type: 'text',
    alignment: 'right',
    width: 15,
    value: (record) => formatDuration(record.startedAt, record.completedAt),
  },

  {
    key: 'startedAt',
    header: 'Start Date/Time',
    type: 'date',
    width: 22,
    numFmt: 'dd/mm/yyyy',
    value: (record) => (record.startedAt ? getDate(record.startedAt) : null),
  },
  {
    key: 'startTime',
    header: 'Start Time',
    type: 'date',
    width: 22,
    numFmt: 'hh:mm:ss AM/PM',
    value: (record) => (record.startedAt ? new Date(record.startedAt) : null),
  },
  {
    key: 'completedAt',
    header: 'End Date/Time',
    type: 'date',
    width: 22,
    numFmt: 'dd/mm/yyyy',
    value: (record) =>
      record.completedAt ? getDate(record.completedAt) : null,
  },
  {
    key: 'endTime',
    header: 'End Time',
    type: 'date',
    width: 22,
    numFmt: 'hh:mm:ss AM/PM',
    value: (record) => (record.startedAt ? new Date(record.startedAt) : null),
  },
];
