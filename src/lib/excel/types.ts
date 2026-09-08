export type ExcelValue = string | number | boolean | Date | null | undefined;

export type ExcelColumnType = 'text' | 'number' | 'date' | 'boolean';

export type ExcelColumn<T> = {
  key: string;
  header: string;
  type?: ExcelColumnType;
  value: (row: T) => ExcelValue;
  width?: number;
  numFmt?: string;
  alignment?: 'left' | 'center' | 'right';
};
