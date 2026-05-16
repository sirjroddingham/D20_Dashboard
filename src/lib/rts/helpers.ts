export function toISOWeek(d: Date): string {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const year = dt.getUTCFullYear();
  const weekStart = new Date(Date.UTC(year, 0, 4));
  const weekNo = String(Math.ceil(((dt.getTime() - weekStart.getTime()) / 86400000 + 1) / 7)).padStart(2, '0');
  return `${year}-W${weekNo}`;
}

export function dateToISOWeek(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Unknown';
  return toISOWeek(d);
}
