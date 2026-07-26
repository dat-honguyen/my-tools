import { describe, expect, it } from 'vitest';
import { regex } from './regex';

describe('regex command', () => {
  it('counts matches', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22 c333']);
    expect(result).toEqual({ text: '3 match(es)', kind: 'success' });
  });

  it('replaces when a replacement is given', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22', 'X']);
    expect(result).toEqual({ text: '2 match(es)\naX bX', kind: 'success' });
  });

  it('errors on an invalid pattern', async () => {
    const result = await regex.run(['(', 'g', 'text']);
    expect(result.kind).toBe('error');
  });
});
