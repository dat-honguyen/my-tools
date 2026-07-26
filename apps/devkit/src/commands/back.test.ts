import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { back } from './back';

describe('back command', () => {
  const originalLocation = window.location;
  const assign = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    assign.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('returns a confirmation message immediately', async () => {
    const result = await back.run([]);
    expect(result).toEqual({ text: 'Returning to portfolio...', kind: 'system' });
  });

  it('navigates to the portfolio root after a short delay', async () => {
    await back.run([]);
    expect(assign).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(assign).toHaveBeenCalledWith('/');
  });
});
