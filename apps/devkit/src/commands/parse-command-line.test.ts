import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './parse-command-line';

describe('parseCommandLine', () => {
  it('returns an empty array for blank input', () => {
    expect(parseCommandLine('')).toEqual([]);
    expect(parseCommandLine('   ')).toEqual([]);
  });

  it('splits plain whitespace-separated tokens', () => {
    expect(parseCommandLine('hash sha256 hello')).toEqual(['hash', 'sha256', 'hello']);
  });

  it('keeps double-quoted spans as one token', () => {
    expect(parseCommandLine('hash sha256 "hello world"')).toEqual(['hash', 'sha256', 'hello world']);
  });

  it('keeps single-quoted spans as one token', () => {
    expect(parseCommandLine("json pretty '{\"a\": 1}'")).toEqual(['json', 'pretty', '{"a": 1}']);
  });

  it('collapses repeated whitespace between tokens', () => {
    expect(parseCommandLine('  hash   sha256  hello  ')).toEqual(['hash', 'sha256', 'hello']);
  });
});
