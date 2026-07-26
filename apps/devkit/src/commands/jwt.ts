import { decodeJwt } from '../tools/jwt-decoder/jwt-decoder.util';
import type { CommandSpec } from './types';

export const jwt: CommandSpec = {
  id: 'jwt',
  summary: "Decode a JWT's header and payload (signature not verified)",
  args: [{ name: 'token', kind: 'string' }],
  run(args) {
    const token = args.join(' ');
    try {
      const { header, payload } = decodeJwt(token);
      const text = `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
      return { text, kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
