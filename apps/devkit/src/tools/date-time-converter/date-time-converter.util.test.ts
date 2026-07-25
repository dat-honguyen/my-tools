import { describe, expect, it } from 'vitest';
import { convertDateTime } from './date-time-converter.util';

describe('convertDateTime', () => {
  it('parses an ISO string', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
    expect(result.offset).toBe('+00:00');
  });

  it('parses a whole-second epoch value', () => {
    const result = convertDateTime('1705320000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('parses a millisecond epoch value', () => {
    const result = convertDateTime('1705320000000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('defaults to now for blank input', () => {
    const before = Date.now();
    const result = convertDateTime('', 'UTC');
    const parsed = new Date(result.iso).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
  });

  it('throws for an invalid date string', () => {
    expect(() => convertDateTime('not a date', 'UTC')).toThrow('Invalid date: not a date');
  });
});
