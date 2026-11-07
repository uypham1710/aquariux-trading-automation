export function parseServerDateTime(text: string): number {
  const match = text.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error(`"${text}" is not in YYYY-MM-DD HH:mm:ss format`);
  }
  const [, year, month, day, hours, minutes, seconds] = match.map(Number);
  return Date.UTC(year, month - 1, day, hours, minutes, seconds);
}
