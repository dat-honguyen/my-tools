import { testRegex } from '../tools/regex-tester/regex-tester.util';
import type { CommandSpec } from './types';

export const regex: CommandSpec = {
  id: 'regex',
  summary: 'Test a regex pattern against text, with an optional replacement',
  args: [
    { name: 'pattern', kind: 'string' },
    { name: 'flags', kind: 'string' },
    { name: 'text', kind: 'string' },
    { name: 'replacement', kind: 'string', optional: true },
  ],
  run(args) {
    const [pattern, flags, text, replacement] = args;
    try {
      const result = testRegex(pattern, flags, text, replacement);
      const countLine = `${result.matches.length} match(es)`;
      const textOffset = countLine.length + 1; // +1 for the newline before `text`
      const highlights: [number, number][] = result.matches.map((match) => {
        const start = textOffset + (match.index ?? 0);
        return [start, start + match[0].length];
      });

      const lines = [countLine, text];
      if (result.replaced !== undefined) lines.push(result.replaced);
      return { text: lines.join('\n'), highlights, kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
