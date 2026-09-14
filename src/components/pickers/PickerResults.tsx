'use client';

import { Users } from 'lucide-react';

import PickerTable from '@/components/pickers/PickerTable';
import type { Picker } from '@/types/pickers';

type PickersResultsProps = {
  pickers: Picker[];
  isUpdating: boolean;
  onToggle: (picker: Picker) => Promise<boolean>;
};

export default function PickersResults({
  pickers,
  isUpdating,
  onToggle,
}: PickersResultsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e3e1] bg-white shadow-[0_4px_20px_rgba(57,53,54,0.04)]">
      <PickerTable
        pickers={pickers}
        isUpdating={isUpdating}
        onToggle={onToggle}
      />
    </section>
  );
}
