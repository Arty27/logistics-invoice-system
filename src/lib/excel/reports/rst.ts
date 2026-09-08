import type { ExcelColumn } from '@/lib/excel/types';
import type { RstEntry } from '@/types/rst';

export const rstColumns: ExcelColumn<RstEntry>[] = [
  {
    key: 'companyName',
    header: 'Company',
    type: 'text',
    width: 25,
    value: (entry) => entry.companyName,
  },

  {
    key: 'skuCode',
    header: 'SKU Code',
    type: 'text',
    width: 20,
    value: (entry) => entry.skuCode,
  },

  {
    key: 'quantity',
    header: 'Quantity',
    type: 'number',
    width: 15,
    alignment: 'right',
    numFmt: '#,##0',
    value: (entry) => entry.quantity,
  },

  {
    key: 'enteredBy',
    header: 'Entered By',
    type: 'text',
    width: 25,
    value: (entry) => entry.enteredBy.name,
  },

  {
    key: 'enteredAt',
    header: 'Entered At',
    type: 'date',
    width: 25,
    numFmt: 'dd/mm/yyyy hh:mm:ss AM/PM',
    value: (entry) => new Date(entry.enteredAt),
  },
];
