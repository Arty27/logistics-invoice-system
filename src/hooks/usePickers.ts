'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  CompaniesResponse,
  Company,
  Picker,
  UserResponse,
  UsersResponse,
} from '@/types/pickers';

export function usePickers() {
  const [pickers, setPickers] = useState<Picker[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [error, setError] = useState('');

  const loadPickers = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        cache: 'no-store',
      });

      const data: UsersResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load users.');
        return;
      }

      setPickers(data.data ?? []);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    setError('');
    setIsLoadingCompanies(true);

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

      setCompanies(
        (data.data ?? []).filter((company) => company.isActive !== false),
      );
    } catch {
      setError('Unable to load companies.');
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    loadPickers();
  }, [loadPickers]);

  const createUser = async (payload: {
    name: string;
    phoneNumber: string;
    password: string;
    companyId: string;
    role: string;
  }) => {
    setError('');
    setIsCreating(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: UserResponse = await response.json();

      if (!response.ok) {
        if (data.details) {
          const firstError = Object.values(data.details)
            .flat()
            .find((message) => typeof message === 'string');

          setError(firstError ?? data.error ?? 'Unable to create user.');
        } else {
          setError(data.error ?? 'Unable to create user.');
        }

        return false;
      }

      if (data.user) {
        setPickers((current) => [...current, data.user!]);
      } else {
        await loadPickers();
      }

      return true;
    } catch {
      setError('Unable to connect to the server.');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const toggleUser = async (picker: Picker) => {
    setError('');
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/users/${picker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !picker.isActive,
        }),
      });

      const data: UserResponse = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to update user.');
        return false;
      }

      if (data.user) {
        setPickers((current) =>
          current.map((item) => (item.id === picker.id ? data.user! : item)),
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
    pickers,
    companies,
    isLoading,
    isLoadingCompanies,
    isCreating,
    isUpdating,
    error,
    setError,
    loadCompanies,
    createUser,
    toggleUser,
  };
}
