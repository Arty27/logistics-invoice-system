export type Company = {
  id: string;
  name: string;
};

export type UserRole = 'SUPERVISOR' | 'PICKER';

export type User = {
  id: string;
  name: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  company: {
    id: string;
    name: string;
  } | null;
};

export type RecordType = 'PACKLIST' | 'INVOICE_VERIFICATION';

export type VerificationResult = 'MATCHED' | 'MISMATCHED' | string;

export type UserType = 'all' | UserRole;

export type AdminRecord = {
  id: string;
  type: RecordType;

  referenceNumber: string;
  invoiceNumber?: string | null;

  quantity: number | null;
  weight: string | null;

  invoiceQuantity?: number | null;
  dispatchedQuantity?: number | null;

  grossWeight?: string | null;
  dispatchedWeight?: string | null;

  result?: VerificationResult | null;
  remarks?: string | null;

  status: string;

  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;

  user: {
    id: string;
    name: string;
    role: UserRole;
    phoneNumber?: string;
  };

  company: {
    id: string;
    name: string;
  };
};

export type CompanyResponse = {
  data: Company[];
};

export type UsersResponse = {
  data: User[];
};

export type RecordsResponse = {
  data: AdminRecord[];
  count: number;
};
