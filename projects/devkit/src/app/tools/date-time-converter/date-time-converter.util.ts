export interface DateTimeConversion {
  iso: string;
  zoned: string;
  offset: string;
}

export function convertDateTime(input: string, timeZone: string): DateTimeConversion {
  const date = parseFlexibleDate(input);
  return {
    iso: date.toISOString(),
    zoned: formatInTimeZone(date, timeZone),
    offset: formatUtcOffset(date, timeZone),
  };
}

function parseFlexibleDate(input: string): Date {
  const trimmed = input.trim();
  if (trimmed === '') {
    return new Date();
  }
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid epoch value: ${input}`);
    }
    return date;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }
  return date;
}

function formatInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(' ', 'T');
}

function formatUtcOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(raw);
  if (!match) {
    return '+00:00';
  }
  const [, sign, hourStr, minuteStr = '00'] = match;
  return `${sign}${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;
}
