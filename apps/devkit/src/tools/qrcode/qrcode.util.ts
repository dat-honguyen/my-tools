import qrcode from 'qrcode-generator';

export function generateQrAscii(text: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createASCII(2);
}
