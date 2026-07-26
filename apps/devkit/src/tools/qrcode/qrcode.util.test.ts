import { describe, expect, it } from 'vitest';
import { generateQrAscii } from './qrcode.util';

describe('generateQrAscii', () => {
  it('renders a compact rectangular grid using half-block characters', () => {
    const ascii = generateQrAscii('hello');
    const lines = ascii.split('\n');
    expect(lines.length).toBeGreaterThan(5);
    expect(lines.every((line) => /^[█▀▄ ]+$/.test(line))).toBe(true);
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
  });

  it('is deterministic for the same input', () => {
    expect(generateQrAscii('hello')).toBe(generateQrAscii('hello'));
  });

  it('produces different output for different input', () => {
    expect(generateQrAscii('hello')).not.toBe(generateQrAscii('world'));
  });
});
