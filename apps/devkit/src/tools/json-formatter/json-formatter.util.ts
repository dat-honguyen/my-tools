export function formatJson(input: string, mode: 'pretty' | 'minify'): string {
  const parsed: unknown = JSON.parse(input);
  return mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}
