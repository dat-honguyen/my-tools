import { decodeUrl, encodeUrl } from './url-codec.util';

describe('encodeUrl', () => {
  it('percent-encodes reserved characters', () => {
    expect(encodeUrl('a b/c?d=e&f')).toBe('a%20b%2Fc%3Fd%3De%26f');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeUrl('a%20b%2Fc%3Fd%3De%26f')).toBe('a b/c?d=e&f');
  });

  it('throws on malformed percent-encoding', () => {
    expect(() => decodeUrl('%')).toThrow('That is not validly percent-encoded.');
  });
});
