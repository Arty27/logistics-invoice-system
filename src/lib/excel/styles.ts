/**
 * Brand colours.
 */
export const EXCEL_COLORS = {
  primary: 'F14902',
  secondary: '393536',
  white: 'FFFFFF',
  lightGray: 'F7F7F6',
  border: 'D9D9D9',
  success: 'E8F5E9',
  successText: '2E7D32',
  error: 'FDECEC',
  errorText: 'C62828',
} as const;

/**
 * Style a header cell.
 *
 * `any` is intentional here because ExcelJS 3.10.0
 * has restrictive typings for several style objects.
 */
export function styleHeader(
  cell: any,
  headerColor: string = EXCEL_COLORS.primary,
  fontColor: string = EXCEL_COLORS.white,
) {
  cell.font = {
    bold: true,
    color: {
      argb: `FF${fontColor}`,
    },
  };

  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: `FF${headerColor}`,
    },
  };

  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  };

  cell.border = {
    top: {
      style: 'thin',
      color: {
        argb: `FF${EXCEL_COLORS.border}`,
      },
    },
    bottom: {
      style: 'thin',
      color: {
        argb: `FF${EXCEL_COLORS.border}`,
      },
    },
    left: {
      style: 'thin',
      color: {
        argb: `FF${EXCEL_COLORS.border}`,
      },
    },
    right: {
      style: 'thin',
      color: {
        argb: `FF${EXCEL_COLORS.border}`,
      },
    },
  };
}

/**
 * Style a normal data cell.
 */
export function styleDataRow(cell: any) {
  cell.alignment = {
    vertical: 'middle',
  };
}
