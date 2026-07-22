import { convertDateTime } from './date-time-converter.util';

describe('convertDateTime', () => {
  it('converts a known UTC instant into UTC, ISO and offset', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
    expect(result.zoned).toBe('2024-01-15T12:00:00');
    expect(result.offset).toBe('+00:00');
  });

  it('applies a named timezone offset, including half-hour zones', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'Asia/Kolkata');
    expect(result.zoned).toBe('2024-01-15T17:30:00');
    expect(result.offset).toBe('+05:30');
  });

  it('treats a small integer input as epoch seconds', () => {
    const result = convertDateTime('0', 'UTC');
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('treats a large integer input as epoch milliseconds', () => {
    const result = convertDateTime('1705320000000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('throws on an unparseable date string', () => {
    expect(() => convertDateTime('not a date', 'UTC')).toThrow('Invalid date: not a date');
  });
});
