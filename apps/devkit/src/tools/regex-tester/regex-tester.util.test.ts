import { describe, expect, it } from 'vitest';
import { testRegex } from './regex-tester.util';

describe('testRegex', () => {
  it('finds all matches', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333', undefined);
    expect(result.matches.map((m) => m.match)).toEqual(['1', '22', '333']);
  });

  it('applies a replacement when provided', () => {
    const result = testRegex('\\d+', '', 'a1 b22', 'X');
    expect(result.replaced).toBe('aX bX');
  });

  it('throws for an invalid pattern', () => {
    expect(() => testRegex('(', '', 'x', undefined)).toThrow();
  });
});
