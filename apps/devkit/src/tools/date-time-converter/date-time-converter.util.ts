export interface DateConversionResult {
  iso: string;
  zoned: string;
  offset: string;
}

function getUtcOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date);
  const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const match = raw.match(/GMT([+-]\d{2}:\d{2})?/);
  return match?.[1] ?? '+00:00';
}

export function convertDateTime(input: string, timeZone: string): DateConversionResult {
  const date = input.trim() === '' ? new Date() : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: '${input}'`);
  }

  const iso = date.toISOString();
  const zoned = new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'long',
  }).format(date);
  const offset = getUtcOffset(date, timeZone);

  return { iso, zoned, offset };
}
