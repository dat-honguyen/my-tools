import { describe, expect, it } from 'vitest';
import { useragent } from './useragent';

describe('useragent command', () => {
  it('parses an explicitly given User-Agent string', async () => {
    const result = await useragent.run(['Mozilla/5.0', '(X11;', 'Linux', 'x86_64;', 'rv:109.0)', 'Gecko/20100101', 'Firefox/115.0']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('Browser: Firefox 115.0');
    expect(result.text).toContain('OS: Linux');
  });

  it('defaults to the current navigator.userAgent when no argument is given', async () => {
    const result = await useragent.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toContain(navigator.userAgent);
  });
});
