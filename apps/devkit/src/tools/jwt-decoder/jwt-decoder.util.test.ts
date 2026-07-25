import { describe, expect, it } from 'vitest';
import { decodeJwt } from './jwt-decoder.util';

function makeSegment(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '123' };
    const token = `${makeSegment(header)}.${makeSegment(payload)}.signature`;
    expect(decodeJwt(token)).toEqual({ header, payload });
  });

  it('throws when there are fewer than two segments', () => {
    expect(() => decodeJwt('onlyonepart')).toThrow(
      'That does not look like a JWT (expected at least two dot-separated parts).',
    );
  });

  it('throws when a segment is not valid base64url JSON', () => {
    expect(() => decodeJwt('not-base64.also-not.sig')).toThrow('Could not decode the JWT header.');
  });
});
