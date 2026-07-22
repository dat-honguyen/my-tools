import { testRegex } from './regex-tester.util';

describe('testRegex', () => {
  it('finds all matches with their indices', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333');
    expect(result.matches).toEqual([
      { match: '1', index: 1 },
      { match: '22', index: 4 },
      { match: '333', index: 8 },
    ]);
  });

  it('replaces matches when a replacement is provided', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333', 'NUM');
    expect(result.replaced).toBe('aNUM bNUM cNUM');
  });

  it('is case-insensitive with the i flag', () => {
    const result = testRegex('abc', 'i', 'ABC abc');
    expect(result.matches).toHaveLength(2);
  });

  it('throws a clear error for an invalid pattern', () => {
    expect(() => testRegex('(', '', 'anything')).toThrow();
  });
});
