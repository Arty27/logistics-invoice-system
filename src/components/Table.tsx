'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  searchValue?: (row: T) => string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  headerClassName?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;

  searchable?: boolean;
  searchPlaceholder?: string;

  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  emptyMessage?: string;
  emptyDescription?: string;

  className?: string;
};

function getAlignmentClass(align: TableColumn<unknown>['align']) {
  switch (align) {
    case 'center':
      return 'text-center';

    case 'right':
      return 'text-right';

    default:
      return 'text-left';
  }
}

export default function Table<T>({
  columns,
  data,
  getRowKey,

  searchable = false,
  searchPlaceholder = 'Search...',

  pagination = false,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],

  emptyMessage = 'No records found',
  emptyDescription,

  className = '',
}: TableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  /*
   * Search
   *
   * By default, searchValue uses the raw object values.
   * A column can provide searchValue when it needs custom
   * searchable text.
   */
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter((row) =>
      columns.some((column) => {
        const value = column.searchValue
          ? column.searchValue(row)
          : String((row as Record<string, unknown>)[column.key] ?? '');

        return value.toLowerCase().includes(query);
      }),
    );
  }, [data, columns, search]);

  /*
   * Pagination
   */

  const totalPages = pagination
    ? Math.ceil(filteredData.length / currentPageSize)
    : 1;

  /*
   * Keep the current page valid when filtering/searching
   * reduces the number of available pages.
   */
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = pagination ? (currentPage - 1) * currentPageSize : 0;

  const endIndex = pagination
    ? startIndex + currentPageSize
    : filteredData.length;

  const visibleData = filteredData.slice(startIndex, endIndex);

  const startRecord = filteredData.length === 0 ? 0 : startIndex + 1;

  const endRecord = Math.min(endIndex, filteredData.length);

  /*
   * Handlers
   */

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newPageSize = Number(event.target.value);

    setCurrentPageSize(newPageSize);
    setCurrentPage(1);
  };

  /*
   * Pagination pages
   *
   * Prevents rendering 50+ page buttons.
   */
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        'ellipsis',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages,
    ];
  }, [currentPage, totalPages]);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Table Toolbar */}

      {searchable && (
        <div className="flex flex-col gap-3 border-b border-[#eeecea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9a9795]" />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-[#d8d6d4] bg-white pr-9 pl-9 text-sm text-[#393536] transition-all duration-200 outline-none placeholder:text-[#a09e9c] hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10"
              aria-label={searchPlaceholder}
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#777473] transition-colors duration-150 hover:bg-[#f7f7f6] hover:text-[#393536]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {search && (
            <p className="text-xs text-[#777473]">
              {filteredData.length}{' '}
              {filteredData.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>
      )}

      {/* Table */}

      {filteredData.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f7f6]">
            <Search className="h-5 w-5 text-[#aaa8a6]" />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#393536]">
            {search ? 'No matching records' : emptyMessage}
          </p>

          <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-[#777473]">
            {search ? 'Try changing your search term.' : emptyDescription}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e5e3e1] bg-[#faf9f8]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    style={{ width: column.width }}
                    className={`px-5 py-3.5 text-xs font-semibold tracking-[0.04em] whitespace-nowrap text-[#6b6968] uppercase ${getAlignmentClass(
                      column.align,
                    )} ${column.headerClassName ?? ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#eeecea]">
              {visibleData.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, startIndex + rowIndex)}
                  className="transition-colors duration-150 hover:bg-[#faf9f8]"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 align-middle text-[#393536] ${getAlignmentClass(
                        column.align,
                      )} ${column.className ?? ''}`}
                    >
                      {column.render(row, startIndex + rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}

      {pagination && filteredData.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-[#eeecea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Result Count */}

          <div className="text-sm text-[#777473]">
            Showing{' '}
            <span className="font-medium text-[#393536]">{startRecord}</span> to{' '}
            <span className="font-medium text-[#393536]">{endRecord}</span> of{' '}
            <span className="font-medium text-[#393536]">
              {filteredData.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size */}

            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-[#777473] sm:block">
                Rows
              </span>

              <select
                value={currentPageSize}
                onChange={handlePageSizeChange}
                className="h-9 cursor-pointer rounded-lg border border-[#d8d6d4] bg-white px-2.5 text-sm text-[#393536] transition-colors duration-200 outline-none hover:border-[#bcb9b7] focus:border-[#f14902] focus:ring-4 focus:ring-[#f14902]/10"
                aria-label="Rows per page"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous */}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#d8d6d4] bg-white text-[#393536] transition-all duration-200 outline-none hover:bg-[#f7f7f6] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}

            <div className="hidden items-center gap-1 sm:flex">
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-9 min-w-9 items-center justify-center text-sm text-[#9a9795]"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(Number(page))}
                    className={`h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition-all duration-200 outline-none focus:ring-4 focus:ring-[#f14902]/10 ${
                      currentPage === page
                        ? 'bg-[#f14902] text-white'
                        : 'cursor-pointer text-[#393536] hover:bg-[#f7f7f6]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Mobile Page Indicator */}

            <span className="text-sm font-medium text-[#393536] sm:hidden">
              {currentPage} / {totalPages}
            </span>

            {/* Next */}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#d8d6d4] bg-white text-[#393536] transition-all duration-200 outline-none hover:bg-[#f7f7f6] focus:ring-4 focus:ring-[#f14902]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
