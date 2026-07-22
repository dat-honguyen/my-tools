export interface EpochToDateResult {
  utc: string;
  local: string;
}

export interface DateToEpochResult {
  seconds: number;
  milliseconds: number;
}

export function epochToDate(input: string): EpochToDateResult {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error('Enter a whole number of seconds or milliseconds.');
  }
  const num = Number(trimmed);
  const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new Error('That epoch value is out of range.');
  }
  return { utc: date.toISOString(), local: date.toString() };
}

export function dateToEpoch(input: string): DateToEpochResult {
  const trimmed = input.trim();
  const date = trimmed === '' ? new Date() : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }
  return { seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}
