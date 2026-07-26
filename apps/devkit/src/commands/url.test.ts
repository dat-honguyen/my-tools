import { describe, expect, it } from 'vitest';
import { url } from './url';

describe('url command', () => {
  it('encodes text', async () => {
    const result = await url.run(['encode', 'a b/c']);
    expect(result).toEqual({ text: 'a%20b%2Fc', kind: 'success' });
  });

  it('decodes text', async () => {
    const result = await url.run(['decode', 'a%20b%2Fc']);
    expect(result).toEqual({ text: 'a b/c', kind: 'success' });
  });

  it('errors on invalid percent-encoding', async () => {
    const result = await url.run(['decode', '%E0%A4%A']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await url.run(['reverse', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('reverse');
  });
});
