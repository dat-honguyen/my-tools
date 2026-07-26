import { describe, expect, it } from 'vitest';
import { convertDateTime } from './date-time-converter.util';

describe('convertDateTime', () => {
  it('converts an ISO date, defaulting the offset to UTC', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
    expect(result.offset).toBe('+00:00');
  });

  it('computes the offset for a given timezone', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'America/New_York');
    expect(result.offset).toBe('-05:00');
  });

  it('defaults to now when input is empty', () => {
    const before = Date.now();
    const result = convertDateTime('', 'UTC');
    const parsed = new Date(result.iso).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
  });

  it('throws on an invalid date string', () => {
    expect(() => convertDateTime('not-a-date', 'UTC')).toThrow();
  });
});
