import { formatJson } from './json-formatter.util';

describe('formatJson', () => {
  it('pretty-prints with 2-space indentation', () => {
    expect(formatJson('{"a":1,"b":[1,2]}', 'pretty')).toBe(
      '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}',
    );
  });

  it('minifies whitespace', () => {
    expect(formatJson('{\n  "a": 1\n}', 'minify')).toBe('{"a":1}');
  });

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{not json}', 'pretty')).toThrow();
  });
});
