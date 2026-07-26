import { sha } from '../tools/hash-generator/hash-generator.util';
import { md5 } from '../tools/hash-generator/md5';
import type { CommandSpec } from './types';

export const hash: CommandSpec = {
  id: 'hash',
  summary: 'Hash text with md5, sha1, or sha256',
  args: [
    { name: 'algorithm', kind: 'enum', choices: ['md5', 'sha1', 'sha256'] },
    { name: 'text', kind: 'string' },
  ],
  async run(args) {
    const [algorithm, ...rest] = args;
    const text = rest.join(' ');
    if (algorithm === 'md5') return { text: md5(text), kind: 'success' };
    if (algorithm === 'sha1') return { text: await sha('SHA-1', text), kind: 'success' };
    if (algorithm === 'sha256') return { text: await sha('SHA-256', text), kind: 'success' };
    return {
      text: `hash: unknown algorithm '${algorithm}'. Expected md5, sha1, or sha256.`,
      kind: 'error',
    };
  },
};
