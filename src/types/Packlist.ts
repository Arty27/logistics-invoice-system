export type Picker = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'PICKER';
};

export type Packlist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  grossWeight: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  pickers: Picker[];
};
