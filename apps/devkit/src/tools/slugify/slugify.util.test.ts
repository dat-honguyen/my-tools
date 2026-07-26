import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.util';

describe('slugify', () => {
  it('slugifies a plain sentence', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('collapses repeated separators and mixed delimiters', () => {
    expect(slugify('  Multiple   Spaces_and-dashes  ')).toBe('multiple-spaces-and-dashes');
  });

  it('strips diacritics', () => {
    expect(slugify('Café déjà vu')).toBe('cafe-deja-vu');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('---Already Slugged---')).toBe('already-slugged');
  });
});
