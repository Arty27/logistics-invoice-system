'use client';

import { useState } from 'react';
import DeliveryFilters from '@/components/delivery-records/DeliveryFilters';
import DeliveryResults from '@/components/delivery-records/DeliveryResults';
import { useDeliveryRecords } from '@/hooks/useDeliveryRecords';
import { exportToExcel } from '@/lib/excel/exporter';
import { deliveryRecordColumns } from '@/lib/excel/reports/delivery-records';
import { formatDateTime } from '@/lib/functions';

export default function AdminInvoiceVerificationsPage() {
  const {
    companies,
    filteredUsers,

    companyId,
    userType,
    userId,

    fromDate,
    toDate,

    records,
    hasSearched,

    isLoadingCompanies,
    usersLoaded,
    isLoadingUsers,
    isSearching,

    error,

    setUserId,
    setFromDate,
    setToDate,

    handleCompanyChange,
    handleUserTypeChange,
    searchRecords,
  } = useDeliveryRecords();

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);

      await exportToExcel({
        fileName: `Records-${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Delivery Records',
        data: records,
        columns: deliveryRecordColumns,
      });
    } catch (error) {
      console.error('Failed to download Excel:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f7f7f6] px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl animate-[pageFadeIn_400ms_ease-out]">
        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#393536] sm:text-[26px]">
            Delivery Records
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6b6968]">
            View packlists and invoice verifications by company, user and date
            range.
          </p>
        </header>

        {/* Filters */}
        <DeliveryFilters
          companies={companies}
          filteredUsers={filteredUsers}
          companyId={companyId}
          userType={userType}
          userId={userId}
          fromDate={fromDate}
          toDate={toDate}
          isLoadingCompanies={isLoadingCompanies}
          usersLoaded={usersLoaded}
          isLoadingUsers={isLoadingUsers}
          isSearching={isSearching}
          error={error}
          onCompanyChange={handleCompanyChange}
          onUserTypeChange={handleUserTypeChange}
          onUserChange={setUserId}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onSearch={searchRecords}
        />

        {/* Results */}
        {hasSearched && (
          <div className="mt-6 animate-[resultsFadeIn_300ms_ease-out]">
            <DeliveryResults
              records={records}
              isDownloading={isDownloading}
              onDownloadExcel={handleDownloadExcel}
              formatDateTime={formatDateTime}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes resultsFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
