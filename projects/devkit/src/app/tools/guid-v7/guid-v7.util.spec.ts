import { generateUuidV7 } from './guid-v7.util';

describe('generateUuidV7', () => {
  it('produces a well-formed UUIDv7 string', () => {
    const uuid = generateUuidV7();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('encodes the current timestamp in the first 48 bits', () => {
    const before = Date.now();
    const uuid = generateUuidV7();
    const after = Date.now();

    const hex = uuid.replace(/-/g, '');
    const timestampMs = parseInt(hex.slice(0, 12), 16);

    expect(timestampMs).toBeGreaterThanOrEqual(before);
    expect(timestampMs).toBeLessThanOrEqual(after);
  });

  it('generates unique values across calls', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(a).not.toBe(b);
  });
});
