import { describe, expect, it } from 'vitest';
import { formatJson } from './json-formatter.util';

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    expect(formatJson('{"a":1}', 'pretty')).toBe('{\n  "a": 1\n}');
  });

  it('minifies', () => {
    expect(formatJson('{ "a" : 1 }', 'minify')).toBe('{"a":1}');
  });

  it('throws for invalid JSON', () => {
    expect(() => formatJson('{not json}', 'pretty')).toThrow();
  });
});
