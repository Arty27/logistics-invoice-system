'use client';

import ExcelJS from 'exceljs';

import { ExcelColumn, ExcelValue } from './types';

/**
 * Convert a value into the correct Excel type.
 */
function resolveExcelValue<T>(column: ExcelColumn<T>, row: T): ExcelValue {
  const value = column.value(row);

  if (value === null || value === undefined || value === '') {
    return value;
  }

  switch (column.type) {
    case 'number': {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }

      const number = Number(String(value).replace(/,/g, '').trim());

      return Number.isFinite(number) ? number : null;
    }

    case 'date': {
      if (value instanceof Date) {
        return value;
      }

      const date = new Date(String(value));

      return Number.isNaN(date.getTime()) ? null : date;
    }

    case 'boolean': {
      if (typeof value === 'boolean') {
        return value;
      }

      return String(value).toLowerCase() === 'true';
    }

    case 'text':
      return String(value);

    default:
      return value;
  }
}

/**
 * Generic Excel exporter.
 *
 * Intentionally kept simple for ExcelJS 3.10.0.
 */
export async function exportToExcel<T>({
  fileName,
  sheetName = 'Sheet1',
  data,
  columns,
}: {
  fileName: string;
  sheetName?: string;
  data: T[];
  columns: ExcelColumn<T>[];
}) {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(sheetName);

  /**
   * -----------------------------
   * HEADER
   * -----------------------------
   */

  columns.forEach((column, index) => {
    const cell = worksheet.getCell(1, index + 1);

    cell.value = column.header;

    /**
     * Keep styling extremely simple.
     */
    cell.font = {
      bold: true,
    };
  });

  /**
   * -----------------------------
   * DATA
   * -----------------------------
   */

  data.forEach((row, rowIndex) => {
    columns.forEach((column, columnIndex) => {
      const cell = worksheet.getCell(rowIndex + 2, columnIndex + 1);

      const value = resolveExcelValue(column, row);

      /**
       * This is the important part.
       *
       * Numbers are assigned as numbers.
       * Strings are assigned as strings.
       */
      cell.value = value!;

      /**
       * Number/date formatting is optional.
       * It does NOT affect the underlying type.
       */
      if (column.numFmt) {
        cell.numFmt = column.numFmt;
      }
    });
  });

  /**
   * -----------------------------
   * COLUMN WIDTH
   * -----------------------------
   */

  columns.forEach((column, index) => {
    if (column.width) {
      worksheet.getColumn(index + 1).width = column.width;
    }
  });

  /**
   * -----------------------------
   * FREEZE HEADER
   * -----------------------------
   *
   * This is safe and simple.
   */

  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 1,
    },
  ];

  /**
   * -----------------------------
   * DOWNLOAD
   * -----------------------------
   */

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;

  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}
