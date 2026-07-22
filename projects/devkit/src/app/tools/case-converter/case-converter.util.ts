function splitWords(input: string): string[] {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toCamelCase(input: string): string {
  return splitWords(input)
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('');
}

export function toPascalCase(input: string): string {
  return splitWords(input)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
}

export function toSnakeCase(input: string): string {
  return splitWords(input).join('_');
}

export function toKebabCase(input: string): string {
  return splitWords(input).join('-');
}
