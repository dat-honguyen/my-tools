import { describe, expect, it } from 'vitest';
import { base64Command } from './base64';

describe('base64 command', () => {
  it('encodes text', async () => {
    const result = await base64Command.run(['encode', 'hello']);
    expect(result).toEqual({ text: 'aGVsbG8=', kind: 'success' });
  });

  it('decodes text', async () => {
    const result = await base64Command.run(['decode', 'aGVsbG8=']);
    expect(result).toEqual({ text: 'hello', kind: 'success' });
  });

  it('errors on invalid base64', async () => {
    const result = await base64Command.run(['decode', 'not-valid-base64!!']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await base64Command.run(['reverse', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('reverse');
  });
});
