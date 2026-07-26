import { describe, expect, it } from 'vitest';
import { guidv4 } from './guidv4';

describe('guidv4 command', () => {
  it('returns a v4 UUID with no args', async () => {
    const result = await guidv4.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
