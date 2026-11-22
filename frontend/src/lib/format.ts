const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 4 });
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'medium' });

export const formatNumber = (n: number) => number.format(n);
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** ISO string → value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
}
