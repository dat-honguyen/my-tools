import { decodeBase64, encodeBase64 } from '../tools/base64-tool/base64-tool.util';
import type { CommandSpec } from './types';

export const base64Command: CommandSpec = {
  id: 'base64',
  summary: 'Encode or decode Base64 text',
  args: [
    { name: 'mode', kind: 'enum', choices: ['encode', 'decode'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    try {
      if (mode === 'encode') return { text: encodeBase64(text), kind: 'success' };
      if (mode === 'decode') return { text: decodeBase64(text), kind: 'success' };
      return {
        text: `base64: unknown mode '${mode}'. Expected encode or decode.`,
        kind: 'error',
      };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
