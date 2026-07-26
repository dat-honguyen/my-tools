export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrl(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error('Invalid percent-encoded input.');
  }
}
