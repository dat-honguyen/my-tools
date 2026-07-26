import { describe, expect, it } from 'vitest';
import { date } from './date';

describe('date command', () => {
  it('converts an ISO date in UTC by default', async () => {
    const result = await date.run(['2024-01-15T12:00:00Z']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('2024-01-15T12:00:00.000Z');
    expect(result.text).toContain('(UTC)');
  });

  it('converts using a given timezone', async () => {
    const result = await date.run(['2024-01-15T12:00:00Z', 'America/New_York']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('(America/New_York)');
  });

  it('errors on an invalid date', async () => {
    const result = await date.run(['not-a-date']);
    expect(result.kind).toBe('error');
  });
});
