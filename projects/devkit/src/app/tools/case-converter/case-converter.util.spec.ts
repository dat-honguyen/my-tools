import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

describe('case converter', () => {
  it('converts a space-separated phrase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toPascalCase('hello world')).toBe('HelloWorld');
    expect(toSnakeCase('hello world')).toBe('hello_world');
    expect(toKebabCase('hello world')).toBe('hello-world');
  });

  it('converts an existing camelCase phrase', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });

  it('converts a mixed snake/kebab phrase', () => {
    expect(toCamelCase('some_mixed-input case')).toBe('someMixedInputCase');
  });

  it('returns an empty string for empty input', () => {
    expect(toCamelCase('')).toBe('');
  });
});
