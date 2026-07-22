import { decodeBase64, encodeBase64 } from './base64-tool.util';

describe('encodeBase64', () => {
  it('encodes plain ASCII text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });
});

describe('decodeBase64', () => {
  it('decodes back to the original text', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('round-trips UTF-8 text including multi-byte characters', () => {
    const original = 'héllo 👋';
    expect(decodeBase64(encodeBase64(original))).toBe(original);
  });

  it('throws on invalid Base64', () => {
    expect(() => decodeBase64('not base64!!!')).toThrow('That is not valid Base64.');
  });
});
