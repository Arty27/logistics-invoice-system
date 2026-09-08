'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  AdminRecord,
  Company,
  CompanyResponse,
  RecordsResponse,
  User,
  UserType,
  UsersResponse,
} from '@/types/delivery-records';

const getToday = () => new Date().toISOString().split('T')[0];

export function useDeliveryRecords() {
  /*
   * ---------------------------------------------------------
   * Companies
   * ---------------------------------------------------------
   */

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  /*
   * ---------------------------------------------------------
   * Users
   * ---------------------------------------------------------
   */

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  /*
   * ---------------------------------------------------------
   * Filters
   * ---------------------------------------------------------
   */

  const [companyId, setCompanyId] = useState('all');
  const [userType, setUserType] = useState<UserType>('all');
  const [userId, setUserId] = useState('all');

  const [fromDate, setFromDate] = useState(getToday);
  const [toDate, setToDate] = useState(getToday);

  /*
   * ---------------------------------------------------------
   * Results
   * ---------------------------------------------------------
   */

  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * Load companies
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const controller = new AbortController();

    async function loadCompanies() {
      try {
        setIsLoadingCompanies(true);
        setError('');

        const response = await fetch('/api/companies', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load companies.');
        }

        const data: CompanyResponse = await response.json();

        setCompanies(data.data ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Failed to load companies:', error);
        setError('Unable to load companies.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCompanies(false);
        }
      }
    }

    loadCompanies();

    return () => controller.abort();
  }, []);

  /*
   * ---------------------------------------------------------
   * Load users
   *
   * Users are loaded once after a company is selected.
   * They are then kept in memory.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (companyId === 'all' || usersLoaded) {
      return;
    }

    const controller = new AbortController();

    async function loadUsers() {
      try {
        setIsLoadingUsers(true);
        setError('');

        const response = await fetch('/api/users', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load users.');
        }

        const data: UsersResponse = await response.json();

        setUsers(data.data ?? []);
        setUsersLoaded(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Failed to load users:', error);
        setError('Unable to load users.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [companyId, usersLoaded]);

  /*
   * ---------------------------------------------------------
   * Filter users
   * ---------------------------------------------------------
   */

  const companyUsers = useMemo(() => {
    if (companyId === 'all') {
      return [];
    }

    return users.filter((user) => user.company?.id === companyId);
  }, [users, companyId]);

  const filteredUsers = useMemo(() => {
    if (userType === 'all') {
      return companyUsers;
    }

    return companyUsers.filter((user) => user.role === userType);
  }, [companyUsers, userType]);

  /*
   * ---------------------------------------------------------
   * Filter handlers
   * ---------------------------------------------------------
   */

  function handleCompanyChange(value: string) {
    setCompanyId(value);
    setUserType('all');
    setUserId('all');
  }

  function handleUserTypeChange(value: UserType) {
    setUserType(value);
    setUserId('all');
  }

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  async function searchRecords() {
    setError('');

    if (!fromDate || !toDate) {
      setError('Please select both dates.');
      return;
    }

    if (companyId === 'all') {
      setError('Please select a company to fetch records.');
      return;
    }

    if (fromDate > toDate) {
      setError('The from date cannot be after the to date.');
      return;
    }

    try {
      setIsSearching(true);

      const params = new URLSearchParams({
        companyId,
        userType,
        userId,
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/admin/records?${params.toString()}`, {
        cache: 'no-store',
      });

      const data: RecordsResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch records.');
      }

      setRecords(data.data ?? []);
      setHasSearched(true);
    } catch (error) {
      console.error('Search records error:', error);

      setRecords([]);
      setHasSearched(true);

      setError(
        error instanceof Error ? error.message : 'Unable to fetch records.',
      );
    } finally {
      setIsSearching(false);
    }
  }

  return {
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
  };
}
