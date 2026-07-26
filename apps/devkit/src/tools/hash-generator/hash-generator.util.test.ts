import { describe, expect, it } from 'vitest';
import { sha } from './hash-generator.util';

describe('sha', () => {
  it('computes sha1', async () => {
    expect(await sha('SHA-1', 'hello')).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('computes sha256', async () => {
    expect(await sha('SHA-256', 'hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
