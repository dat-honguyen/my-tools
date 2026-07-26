import { describe, expect, it } from 'vitest';
import { decodeJwt } from './jwt-decoder.util';

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9lIn0.dGVzdA';
    const { header, payload } = decodeJwt(token);
    expect(header).toEqual({ alg: 'HS256' });
    expect(payload).toEqual({ sub: '123', name: 'Joe' });
  });

  it('throws on a malformed token', () => {
    expect(() => decodeJwt('not-a-jwt')).toThrow(/JWT/);
  });
});
