import { describe, expect, it } from 'vitest';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

describe('case conversions', () => {
  it('converts "hello world" / "HelloWorld" / "hello_world" all to the same forms', () => {
    for (const input of ['hello world', 'HelloWorld', 'hello_world', 'hello-world']) {
      expect(toCamelCase(input)).toBe('helloWorld');
      expect(toPascalCase(input)).toBe('HelloWorld');
      expect(toSnakeCase(input)).toBe('hello_world');
      expect(toKebabCase(input)).toBe('hello-world');
    }
  });
});
