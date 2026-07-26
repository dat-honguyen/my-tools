import { describe, expect, it } from 'vitest';
import { qrcode } from './qrcode';

describe('qrcode command', () => {
  it('renders ASCII art for the given text', async () => {
    const result = await qrcode.run(['https://example.com']);
    expect(result.kind).toBe('success');
    expect(result.text.split('\n').length).toBeGreaterThan(10);
  });

  it('joins unquoted multi-word text', async () => {
    const result = await qrcode.run(['hello', 'world']);
    const soloResult = await qrcode.run(['hello world']);
    expect(result.text).toBe(soloResult.text);
  });
});
