import { describe, expect, it } from 'vitest';
import { slug } from './slug';

describe('slug command', () => {
  it('slugifies unquoted multi-word text', async () => {
    const result = await slug.run(['Hello', 'World!']);
    expect(result).toEqual({ text: 'hello-world', kind: 'success' });
  });
});
