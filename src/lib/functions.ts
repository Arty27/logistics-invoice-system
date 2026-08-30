export function splitEvenly(n: number, parts: number): number[] {
  const base = Math.floor(n / parts);
  const remainder = n % parts;

  return Array.from(
    { length: parts },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}

export function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
) {
  if (!startedAt || !completedAt) {
    return 'Not available';
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 'Not available';
  }

  const differenceInSeconds = Math.max(0, Math.floor((end - start) / 1000));

  const hours = Math.floor(differenceInSeconds / 3600);

  const minutes = Math.floor((differenceInSeconds % 3600) / 60);

  const seconds = differenceInSeconds % 60;

  return `${hours} h ${minutes} m ${seconds} s`;
}
