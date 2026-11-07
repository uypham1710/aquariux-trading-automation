export function parseDisplayNumber(text: string): number {
  const value = Number(text.replace(/,/g, '').trim());
  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse "${text}" as a number`);
  }
  return value;
}

export function parseOptionalNumber(text: string): number | null {
  return text.trim() === '--' ? null : parseDisplayNumber(text);
}
