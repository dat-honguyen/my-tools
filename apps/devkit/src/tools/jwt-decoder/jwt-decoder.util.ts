function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export interface DecodedJwt {
  header: unknown;
  payload: unknown;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: expected 3 dot-separated segments.');
  }
  const [headerPart, payloadPart] = parts;
  try {
    const header = JSON.parse(base64UrlDecode(headerPart));
    const payload = JSON.parse(base64UrlDecode(payloadPart));
    return { header, payload };
  } catch {
    throw new Error('Invalid JWT: could not decode header/payload.');
  }
}
