import { describe, expect, it } from 'vitest';
import { dateToEpoch, epochToDate } from './epoch-converter.util';

describe('epochToDate', () => {
  it('treats a 10-digit value as epoch seconds', () => {
    const result = epochToDate('1705320000');
    expect(result.utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('treats a 13-digit value as epoch milliseconds', () => {
    const result = epochToDate('1705320000000');
    expect(result.utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('throws on a non-numeric value', () => {
    expect(() => epochToDate('abc')).toThrow();
  });
});

describe('dateToEpoch', () => {
  it('converts an ISO date to epoch seconds and milliseconds', () => {
    expect(dateToEpoch('2024-01-15T12:00:00Z')).toEqual({ seconds: 1705320000, milliseconds: 1705320000000 });
  });

  it('throws on an invalid date', () => {
    expect(() => dateToEpoch('not-a-date')).toThrow();
  });
});
