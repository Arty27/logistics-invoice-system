'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  CompaniesResponse,
  Company,
  CompanyResponse,
} from '@/types/companies';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [error, setError] = useState('');

  const loadCompanies = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'GET',
        cache: 'no-store',
      });

      const data: CompaniesResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load companies.');
        return;
      }

      setCompanies(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const createCompany = async (name: string) => {
    setError('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Company name is required.');
      return false;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data: CompanyResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to create company.');
        return false;
      }

      if (data.company) {
        setCompanies((current) => [...current, data.company!]);
      } else {
        await loadCompanies();
      }

      return true;
    } catch {
      setError('Unable to connect to the server.');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const updateCompany = async (
    companyId: string,
    updates: {
      name?: string;
      isActive?: boolean;
    },
  ) => {
    setError('');
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data: CompanyResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to update company.');
        return false;
      }

      if (data.company) {
        setCompanies((current) =>
          current.map((company) =>
            company.id === data.company!.id ? data.company! : company,
          ),
        );
      }

      return true;
    } catch {
      setError('Unable to connect to the server.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    companies,
    isLoading,
    isCreating,
    isUpdating,
    error,
    setError,
    createCompany,
    updateCompany,
    reload: loadCompanies,
  };
}
