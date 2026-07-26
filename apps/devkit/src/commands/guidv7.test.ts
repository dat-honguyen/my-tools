import { describe, expect, it } from 'vitest';
import { guidv7 } from './guidv7';

describe('guidv7 command', () => {
  it('returns a v7 UUID with no args', async () => {
    const result = await guidv7.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
