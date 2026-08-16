export function splitEvenly(n: number, parts: number): number[] {
  const base = Math.floor(n / parts);
  const remainder = n % parts;

  return Array.from(
    { length: parts },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
}
