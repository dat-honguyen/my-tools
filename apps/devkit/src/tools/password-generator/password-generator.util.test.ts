import { describe, expect, it } from 'vitest';
import { generatePassword } from './password-generator.util';

describe('generatePassword', () => {
  it('generates a password of the requested length', () => {
    expect(generatePassword(20)).toHaveLength(20);
  });

  it('only uses digits when charset is numeric', () => {
    expect(generatePassword(40, 'numeric')).toMatch(/^[0-9]{40}$/);
  });

  it('only uses letters when charset is alpha', () => {
    expect(generatePassword(40, 'alpha')).toMatch(/^[A-Za-z]{40}$/);
  });

  it('only uses letters and digits when charset is alnum', () => {
    expect(generatePassword(40, 'alnum')).toMatch(/^[A-Za-z0-9]{40}$/);
  });

  it('produces different output across calls', () => {
    expect(generatePassword(20)).not.toBe(generatePassword(20));
  });
});
