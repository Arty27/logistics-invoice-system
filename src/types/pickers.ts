export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'PICKER';

export type Company = {
  id: string;
  name: string;
  isActive?: boolean;
};

export type Picker = {
  id: string;
  name: string;
  company: {
    id: string;
    name: string;
  } | null;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type CompaniesResponse = {
  error?: string;
  data?: Company[];
};

export type UsersResponse = {
  error?: string;
  data?: Picker[];
};

export type UserResponse = {
  error?: string;
  user?: Picker;
  details?: Record<string, unknown>;
};
