import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl } from './url-codec.util';

describe('encodeUrl', () => {
  it('percent-encodes special characters', () => {
    expect(encodeUrl('a b/c?d=e')).toBe('a%20b%2Fc%3Fd%3De');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeUrl('a%20b')).toBe('a b');
  });

  it('throws for malformed percent-encoding', () => {
    expect(() => decodeUrl('%')).toThrow('That is not validly percent-encoded.');
  });
});
