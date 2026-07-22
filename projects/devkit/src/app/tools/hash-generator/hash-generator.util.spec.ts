import { sha } from './hash-generator.util';

describe('sha', () => {
  it('computes a known SHA-256 digest', async () => {
    expect(await sha('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes a known SHA-1 digest', async () => {
    expect(await sha('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
});
