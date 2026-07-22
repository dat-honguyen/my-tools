export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  let binary: string;
  try {
    binary = atob(input.trim());
  } catch {
    throw new Error('That is not valid Base64.');
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder(undefined, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('That decodes to invalid UTF-8.');
  }
}
