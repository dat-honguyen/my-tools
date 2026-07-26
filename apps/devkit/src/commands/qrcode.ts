import { generateQrAscii } from '../tools/qrcode/qrcode.util';
import type { CommandSpec } from './types';

export const qrcode: CommandSpec = {
  id: 'qrcode',
  summary: 'Render a QR code for text/URL as ASCII art',
  args: [{ name: 'text', kind: 'string' }],
  run(args) {
    const text = args.join(' ');
    try {
      return { text: generateQrAscii(text), kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
