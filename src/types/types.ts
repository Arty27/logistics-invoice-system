export type DeliveryType = 'INWARD' | 'OUTWARD' | 'MATERIAL_RETURN' | 'OTHER';

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  INWARD: 'Inward',
  OUTWARD: 'Outward',
  MATERIAL_RETURN: 'Material Return',
  OTHER: 'Other',
};
