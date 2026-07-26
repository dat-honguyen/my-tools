import { convertDateTime } from '../tools/date-time-converter/date-time-converter.util';
import type { CommandSpec } from './types';

export const date: CommandSpec = {
  id: 'date',
  summary: 'Convert a date (or now) to ISO, a timezone, and its UTC offset',
  args: [
    { name: 'input', kind: 'string', optional: true },
    { name: 'timeZone', kind: 'string', optional: true },
  ],
  run(args) {
    const [input = '', timeZone = 'UTC'] = args;
    try {
      const result = convertDateTime(input, timeZone);
      return {
        text: `${result.iso}\n${result.zoned} (${timeZone})\n${result.offset}`,
        copyText: result.iso,
        kind: 'success',
      };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
