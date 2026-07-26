import { describe, expect, it } from 'vitest';
import { epoch } from './epoch';

describe('epoch command', () => {
  it('converts epoch seconds to a date', async () => {
    const result = await epoch.run(['to-date', '1705320000']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('2024-01-15T12:00:00.000Z');
  });

  it('converts a date to epoch', async () => {
    const result = await epoch.run(['to-epoch', '2024-01-15T12:00:00Z']);
    expect(result).toEqual({ text: '1705320000\n1705320000000', kind: 'success' });
  });

  it('errors on a non-numeric epoch value', async () => {
    const result = await epoch.run(['to-date', 'abc']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await epoch.run(['sideways', '123']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('sideways');
  });
});
