export type RstEntry = {
  id: string;
  skuCode: string;
  companyName: string;
  quantity: number;
  enteredAt: string;
  enteredBy: {
    id: string;
    name: string;
  };
};

export type RstApiResponse = {
  data?: RstEntry[];
  count?: number;
  error?: string;
};
