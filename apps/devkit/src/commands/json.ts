import { formatJson } from '../tools/json-formatter/json-formatter.util';
import type { CommandSpec } from './types';

export const jsonCommand: CommandSpec = {
  id: 'json',
  summary: 'Pretty-print or minify JSON',
  args: [
    { name: 'mode', kind: 'enum', choices: ['pretty', 'minify'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    if (mode !== 'pretty' && mode !== 'minify') {
      return { text: `json: unknown mode '${mode}'. Expected pretty or minify.`, kind: 'error' };
    }
    try {
      return { text: formatJson(text, mode), kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
