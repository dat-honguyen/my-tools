import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl } from './url-codec.util';

describe('url-codec.util', () => {
  it('encodes text', () => {
    expect(encodeUrl('a b/c')).toBe('a%20b%2Fc');
  });

  it('decodes text', () => {
    expect(decodeUrl('a%20b%2Fc')).toBe('a b/c');
  });

  it('throws on invalid percent-encoding', () => {
    expect(() => decodeUrl('%E0%A4%A')).toThrow();
  });
});
