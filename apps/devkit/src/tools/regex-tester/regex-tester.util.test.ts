import { describe, expect, it } from 'vitest';
import { testRegex } from './regex-tester.util';

describe('testRegex', () => {
  it('counts matches', () => {
    const result = testRegex('\\d+', 'g', 'a1 b22 c333');
    expect(result.matches.length).toBe(3);
    expect(result.replaced).toBeUndefined();
  });

  it('replaces when a replacement is given', () => {
    const result = testRegex('\\d+', 'g', 'a1 b22', 'X');
    expect(result.matches.length).toBe(2);
    expect(result.replaced).toBe('aX bX');
  });

  it('throws on an invalid pattern', () => {
    expect(() => testRegex('(', 'g', 'text')).toThrow();
  });
});
