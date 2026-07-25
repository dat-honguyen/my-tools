import { describe, expect, it } from 'vitest';
import { md5 } from './md5';

describe('md5', () => {
  it('matches known MD5 digests', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});
