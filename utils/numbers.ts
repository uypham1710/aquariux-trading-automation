// The UI shows numbers with thousand separators ("4,089.00", "10,000").
export function parseDisplayNumber(text: string): number {
  const value = Number(text.replace(/,/g, '').trim());
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse "${text}" as a number`);
  }
  return value;
}

// Empty SL/TP/P&L cells are shown as "--".
export function parseOptionalNumber(text: string): number | null {
  return text.trim() === '--' ? null : parseDisplayNumber(text);
}
