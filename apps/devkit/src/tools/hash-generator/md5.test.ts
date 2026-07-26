import { describe, expect, it } from 'vitest';
import { md5 } from './md5';

describe('md5', () => {
  it('hashes an empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('hashes "hello"', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('hashes "hello world"', () => {
    expect(md5('hello world')).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
  });

  it('hashes a string longer than one 64-byte block', () => {
    const long = 'a'.repeat(200);
    expect(md5(long)).toBe('887f30b43b2867f4a9accceee7d16e6c');
  });
});
