import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

describe('encodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });

  it('encodes UTF-8 text', () => {
    expect(encodeBase64('héllo')).toBe(btoa(unescape(encodeURIComponent('héllo'))));
  });
});

describe('decodeBase64', () => {
  it('decodes valid Base64', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('throws for invalid Base64', () => {
    expect(() => decodeBase64('not base64!!')).toThrow('That is not valid Base64.');
  });
});
