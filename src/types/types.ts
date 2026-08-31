import { UserRole } from '@prisma/client';

export type DeliveryType = 'INWARD' | 'OUTWARD' | 'MATERIAL_RETURN' | 'OTHER';

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  INWARD: 'Inward',
  OUTWARD: 'Outward',
  MATERIAL_RETURN: 'Material Return',
  OTHER: 'Other',
};

export type NavbarButton = {
  id: number;
  label: string;
  route: string;
  isDefault: boolean;
};

export type User = {
  name: string;
  role: keyof typeof UserRole;
  company: {
    name: string;
  } | null;
};
