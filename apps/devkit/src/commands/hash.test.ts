import { describe, expect, it } from 'vitest';
import { hash } from './hash';

describe('hash command', () => {
  it('computes md5', async () => {
    const result = await hash.run(['md5', 'hello']);
    expect(result).toEqual({ text: '5d41402abc4b2a76b9719d911017c592', kind: 'success' });
  });

  it('computes sha1', async () => {
    const result = await hash.run(['sha1', 'hello']);
    expect(result.kind).toBe('success');
    expect(result.text).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('computes sha256', async () => {
    const result = await hash.run(['sha256', 'hello']);
    expect(result.kind).toBe('success');
    expect(result.text).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('joins unquoted multi-word text', async () => {
    const result = await hash.run(['md5', 'hello', 'world']);
    expect(result).toEqual({ text: '5eb63bbbe01eeed093cb22bb8f5acdc3', kind: 'success' });
  });

  it('errors on an unknown algorithm', async () => {
    const result = await hash.run(['sha512', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('sha512');
  });
});
