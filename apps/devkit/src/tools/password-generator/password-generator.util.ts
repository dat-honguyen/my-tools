const CHARSETS = {
  all: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+',
  alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numeric: '0123456789',
} as const;

export type PasswordCharset = keyof typeof CHARSETS;

export function generatePassword(length: number, charset: PasswordCharset = 'all'): string {
  const chars = CHARSETS[charset];
  // Largest multiple of chars.length that fits in a uint32, so `value % chars.length`
  // stays uniform — values at or above this are rejected instead of introducing bias.
  const max = Math.floor(0x100000000 / chars.length) * chars.length;
  const buffer = new Uint32Array(1);
  let result = '';
  while (result.length < length) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < max) {
      result += chars[buffer[0] % chars.length];
    }
  }
  return result;
}
