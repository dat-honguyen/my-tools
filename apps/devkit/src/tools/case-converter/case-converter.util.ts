function splitWords(text: string): string[] {
  return text
    .trim()
    .split(/[\s_-]+|(?=[A-Z])/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toCamelCase(text: string): string {
  const words = splitWords(text);
  return words
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

export function toPascalCase(text: string): string {
  return splitWords(text)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toSnakeCase(text: string): string {
  return splitWords(text).join('_');
}

export function toKebabCase(text: string): string {
  return splitWords(text).join('-');
}
