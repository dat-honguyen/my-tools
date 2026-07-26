import { describe, expect, it } from 'vitest';
import { regex } from './regex';

describe('regex command', () => {
  it('counts matches and shows the tested text with highlight ranges', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22 c333']);
    expect(result.kind).toBe('success');
    expect(result.text).toBe('3 match(es)\na1 b22 c333');
    // Ranges are relative to the full `text` string ("3 match(es)\n" + "a1 b22 c333").
    const prefixLen = '3 match(es)\n'.length;
    expect(result.highlights).toEqual([
      [prefixLen + 1, prefixLen + 2],
      [prefixLen + 4, prefixLen + 6],
      [prefixLen + 8, prefixLen + 11],
    ]);
    for (const [start, end] of result.highlights ?? []) {
      expect(result.text.slice(start, end)).toMatch(/^\d+$/);
    }
  });

  it('replaces when a replacement is given, appending the replaced line', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22', 'X']);
    expect(result.text).toBe('2 match(es)\na1 b22\naX bX');
  });

  it('errors on an invalid pattern', async () => {
    const result = await regex.run(['(', 'g', 'text']);
    expect(result.kind).toBe('error');
  });
});
