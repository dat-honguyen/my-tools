function rotl(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c));
}

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

function toUtf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

export function md5(text: string): string {
  const bytes = toUtf8Bytes(text);
  const originalLengthBits = bytes.length * 8;

  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) {
    bytes.push((originalLengthBits / 2 ** (8 * i)) & 0xff);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
    const M = new Array<number>(16);
    for (let i = 0; i < 16; i++) {
      const offset = chunkStart + i * 4;
      M[i] =
        (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const toLittleEndianHex = (n: number): string =>
    [0, 8, 16, 24].map((shift) => ((n >>> shift) & 0xff).toString(16).padStart(2, '0')).join('');

  return toLittleEndianHex(a0) + toLittleEndianHex(b0) + toLittleEndianHex(c0) + toLittleEndianHex(d0);
}
