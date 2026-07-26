import qrcode from 'qrcode-generator';

export function generateQrAscii(text: string): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  // No argument (cellSize < 2) selects the library's half-block renderer:
  // 1 character per module, 2 module-rows packed into each printed line via
  // ▀/▄/█ — about a quarter the footprint of the full-block (cellSize: 2)
  // rendering, while staying scannable.
  return qr.createASCII();
}
