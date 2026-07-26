import { describe, expect, it } from 'vitest';
import { jwt } from './jwt';

describe('jwt command', () => {
  it('decodes header and payload', async () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9lIn0.dGVzdA';
    const result = await jwt.run([token]);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('"alg": "HS256"');
    expect(result.text).toContain('"sub": "123"');
  });

  it('errors on a malformed token', async () => {
    const result = await jwt.run(['not-a-jwt']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('JWT');
  });
});
