export function formatJson(text: string, mode: 'pretty' | 'minify'): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'could not parse.'}`);
  }
  return mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}
