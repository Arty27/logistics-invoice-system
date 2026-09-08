export type Company = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompaniesResponse = {
  success?: boolean;
  error?: string;
  data?: Company[];
};

export type CompanyResponse = {
  success?: boolean;
  error?: string;
  company?: Company;
};
