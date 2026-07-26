import { decodeUrl, encodeUrl } from '../tools/url-codec/url-codec.util';
import type { CommandSpec } from './types';

export const url: CommandSpec = {
  id: 'url',
  summary: 'URL-encode or decode text',
  args: [
    { name: 'mode', kind: 'enum', choices: ['encode', 'decode'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    try {
      if (mode === 'encode') return { text: encodeUrl(text), kind: 'success' };
      if (mode === 'decode') return { text: decodeUrl(text), kind: 'success' };
      return { text: `url: unknown mode '${mode}'. Expected encode or decode.`, kind: 'error' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
