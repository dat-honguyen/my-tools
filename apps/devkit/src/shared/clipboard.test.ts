import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns true when the Clipboard API succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    // jsdom doesn't implement execCommand at all, so it must be assigned rather than spied on.
    document.execCommand = vi.fn().mockReturnValue(true);
    await expect(copyToClipboard('hello')).resolves.toBe(true);
  });

  it('returns false when both the Clipboard API and the fallback fail', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('no selection');
    });
    await expect(copyToClipboard('hello')).resolves.toBe(false);
  });
});
