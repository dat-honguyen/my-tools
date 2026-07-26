import { describe, expect, it } from 'vitest';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

describe('case-converter.util', () => {
  it('converts to camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
  });

  it('converts to PascalCase', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
  });

  it('converts to snake_case', () => {
    expect(toSnakeCase('hello world')).toBe('hello_world');
  });

  it('converts to kebab-case', () => {
    expect(toKebabCase('hello world')).toBe('hello-world');
  });

  it('handles already camelCased input', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });
});
