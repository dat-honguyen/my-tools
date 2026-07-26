export interface EpochToDateResult {
  utc: string;
  local: string;
}

export interface DateToEpochResult {
  seconds: number;
  milliseconds: number;
}

const SECONDS_MAGNITUDE_THRESHOLD = 1e12;

export function epochToDate(input: string): EpochToDateResult {
  const num = Number(input);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid epoch value: '${input}'`);
  }
  const milliseconds = Math.abs(num) < SECONDS_MAGNITUDE_THRESHOLD ? num * 1000 : num;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid epoch value: '${input}'`);
  }
  return { utc: date.toISOString(), local: date.toString() };
}

export function dateToEpoch(input: string): DateToEpochResult {
  const date = input.trim() === '' ? new Date() : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: '${input}'`);
  }
  const milliseconds = date.getTime();
  return { seconds: Math.floor(milliseconds / 1000), milliseconds };
}
