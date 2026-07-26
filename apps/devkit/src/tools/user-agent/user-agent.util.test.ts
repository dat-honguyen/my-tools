import { describe, expect, it } from 'vitest';
import { parseUserAgent } from './user-agent.util';

describe('parseUserAgent', () => {
  it('detects desktop Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Chrome', browserVersion: '120.0.0.0', os: 'Windows 10/11', device: 'desktop' });
  });

  it('detects Edge (a Chromium UA) as Edge, not Chrome', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const result = parseUserAgent(ua);
    expect(result.browser).toBe('Edge');
    expect(result.browserVersion).toBe('120.0.0.0');
  });

  it('detects Firefox on Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Firefox', browserVersion: '115.0', os: 'Linux', device: 'desktop' });
  });

  it('detects desktop Safari on macOS', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(parseUserAgent(ua)).toEqual({ browser: 'Safari', browserVersion: '17.0', os: 'macOS', device: 'desktop' });
  });

  it('detects mobile Safari on iOS as a mobile device', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const result = parseUserAgent(ua);
    expect(result.os).toBe('iOS');
    expect(result.device).toBe('mobile');
  });

  it('detects Android Chrome as a mobile device', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const result = parseUserAgent(ua);
    expect(result.browser).toBe('Chrome');
    expect(result.os).toBe('Android');
    expect(result.device).toBe('mobile');
  });

  it('falls back to Unknown for an unrecognized UA', () => {
    const result = parseUserAgent('SomeCustomAgent/1.0');
    expect(result.browser).toBe('Unknown');
    expect(result.os).toBe('Unknown');
    expect(result.device).toBe('desktop');
  });
});
