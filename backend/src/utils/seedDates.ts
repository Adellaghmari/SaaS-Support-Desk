export function daysAgo(days: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, (days * 3) % 60, 0, 0);
  return d.toISOString();
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function hoursAfter(isoDate: string, hours: number): string {
  const d = new Date(isoDate);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}
