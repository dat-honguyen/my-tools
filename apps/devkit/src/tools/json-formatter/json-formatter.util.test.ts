import { describe, expect, it } from 'vitest';
import { formatJson } from './json-formatter.util';

describe('formatJson', () => {
  it('pretty-prints JSON', () => {
    expect(formatJson('{"a":1}', 'pretty')).toBe('{\n  "a": 1\n}');
  });

  it('minifies JSON', () => {
    expect(formatJson('{\n  "a": 1\n}', 'minify')).toBe('{"a":1}');
  });

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{not json}', 'pretty')).toThrow();
  });
});
