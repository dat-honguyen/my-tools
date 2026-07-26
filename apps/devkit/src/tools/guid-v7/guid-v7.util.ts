export function generateUuidV7(): string {
  const timestamp = Date.now();
  const timeHex = timestamp.toString(16).padStart(12, '0');

  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');

  const timeLow = timeHex.slice(0, 8);
  const timeMid = timeHex.slice(8, 12);
  const verAndRandA = '7' + randomHex.slice(0, 3);
  const variantByte = ((parseInt(randomHex.slice(3, 5), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');
  const randB = variantByte + randomHex.slice(5, 8) + randomHex.slice(8, 20).padEnd(12, '0');

  return `${timeLow}-${timeMid}-${verAndRandA}-${randB.slice(0, 4)}-${randB.slice(4, 16)}`;
}
