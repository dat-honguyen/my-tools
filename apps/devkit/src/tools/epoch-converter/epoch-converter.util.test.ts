import { describe, expect, it } from 'vitest';
import { dateToEpoch, epochToDate } from './epoch-converter.util';

describe('epochToDate', () => {
  it('converts whole seconds', () => {
    expect(epochToDate('1705320000').utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('converts milliseconds', () => {
    expect(epochToDate('1705320000000').utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('rejects non-numeric input', () => {
    expect(() => epochToDate('abc')).toThrow('Enter a whole number of seconds or milliseconds.');
  });
});

describe('dateToEpoch', () => {
  it('converts an ISO date to seconds and milliseconds', () => {
    const result = dateToEpoch('2024-01-15T12:00:00Z');
    expect(result.seconds).toBe(1705320000);
    expect(result.milliseconds).toBe(1705320000000);
  });

  it('rejects an invalid date', () => {
    expect(() => dateToEpoch('nope')).toThrow('Invalid date: nope');
  });
});
