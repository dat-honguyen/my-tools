import { decodeJwt } from './jwt-decoder.util';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('decodeJwt', () => {
  it('decodes the header and payload of a well-known sample JWT', () => {
    const decoded = decodeJwt(SAMPLE_JWT);
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
  });

  it('throws when the token has fewer than two parts', () => {
    expect(() => decodeJwt('not-a-jwt')).toThrow(
      'That does not look like a JWT (expected at least two dot-separated parts).',
    );
  });

  it('throws when a segment is not valid base64url JSON', () => {
    expect(() => decodeJwt('!!!.!!!')).toThrow('Could not decode the JWT header.');
  });
});
