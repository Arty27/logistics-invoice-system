export default function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-xs font-medium tracking-wide text-[#777473] uppercase">
        {label}
      </p>

      <p className="text-sm font-medium text-[#393536] sm:text-right">
        {value}
      </p>
    </div>
  );
}
