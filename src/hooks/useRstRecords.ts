'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RstApiResponse, RstEntry } from '@/types/rst';

function getTodayDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function useRstRecords() {
  const [entries, setEntries] = useState<RstEntry[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadEntries = useCallback(
    async (selectedStartDate?: string, selectedEndDate?: string) => {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();

        if (selectedStartDate && selectedEndDate) {
          params.set('startDate', selectedStartDate);
          params.set('endDate', selectedEndDate);
        }

        const query = params.toString();

        const response = await fetch(
          `/api/admin/rst${query ? `?${query}` : ''}`,
          {
            method: 'GET',
            cache: 'no-store',
          },
        );

        const data: RstApiResponse = await response.json();

        if (!response.ok) {
          setError(data.error ?? 'Unable to load RST entries.');
          return;
        }

        setEntries(data.data ?? []);
      } catch {
        setError('Unable to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const today = getTodayDate();

    setStartDate(today);
    setEndDate(today);

    loadEntries();
  }, [loadEntries]);

  const search = async () => {
    setError('');
    setSuccess('');

    if (!startDate || !endDate) {
      setError('Please select both start date and end date.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }

    await loadEntries(startDate, endDate);
  };

  const showToday = async () => {
    const today = getTodayDate();

    setStartDate(today);
    setEndDate(today);

    setError('');
    setSuccess('');

    await loadEntries(today, today);
  };

  const totalQuantity = entries.reduce(
    (total, entry) => total + entry.quantity,
    0,
  );

  return {
    entries,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    isLoading,
    error,
    success,
    setError,
    setSuccess,
    search,
    showToday,
    totalQuantity,
  };
}
