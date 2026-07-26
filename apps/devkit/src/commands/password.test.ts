import { describe, expect, it } from 'vitest';
import { password } from './password';

describe('password command', () => {
  it('generates a 16-char password by default', async () => {
    const result = await password.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toHaveLength(16);
  });

  it('generates a password of a requested length', async () => {
    const result = await password.run(['24']);
    expect(result.kind).toBe('success');
    expect(result.text).toHaveLength(24);
  });

  it('respects the requested charset', async () => {
    const result = await password.run(['10', 'numeric']);
    expect(result.text).toMatch(/^[0-9]{10}$/);
  });

  it('errors on a non-numeric length', async () => {
    const result = await password.run(['abc']);
    expect(result.kind).toBe('error');
  });

  it('errors on a length outside 1-256', async () => {
    const result = await password.run(['0']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown charset', async () => {
    const result = await password.run(['10', 'symbols']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('symbols');
  });
});
