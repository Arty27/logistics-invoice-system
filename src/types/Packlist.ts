export type Picker = {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'ADMIN' | 'PICKER' | 'SUPERVISOR';
};

export type Packlist = {
  id: string;
  packlistNumber: string;
  invoiceQuantity: number;
  referenceNumber: string;
  deliveryType: 'INWARD' | 'OUTWARD' | 'MATERIAL_RETURN' | 'OTHER';
  grossWeight: string;
  perPersonWeight: number;
  status: 'ACTIVE' | 'COMPLETED' | 'LEGACY';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  pickers: Picker[];
};
