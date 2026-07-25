import { describe, expect, it } from 'vitest';
import { generateUuidV7 } from './guid-v7.util';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuidV7', () => {
  it('produces a valid v7 UUID', () => {
    expect(generateUuidV7()).toMatch(UUID_V7);
  });

  it('produces increasing values for increasing timestamps', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(a.slice(0, 8) <= b.slice(0, 8)).toBe(true);
  });
});
