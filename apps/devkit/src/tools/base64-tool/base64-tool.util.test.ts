import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

describe('base64-tool.util', () => {
  it('encodes text to base64', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });

  it('decodes base64 to text', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('round-trips unicode text', () => {
    const original = 'héllo 世界';
    expect(decodeBase64(encodeBase64(original))).toBe(original);
  });

  it('throws on invalid base64', () => {
    expect(() => decodeBase64('not-valid-base64!!')).toThrow();
  });
});
