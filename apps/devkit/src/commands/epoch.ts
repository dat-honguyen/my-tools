import { dateToEpoch, epochToDate } from '../tools/epoch-converter/epoch-converter.util';
import type { CommandSpec } from './types';

export const epoch: CommandSpec = {
  id: 'epoch',
  summary: 'Convert epoch to a date, or a date to epoch seconds/ms',
  args: [
    { name: 'mode', kind: 'enum', choices: ['to-date', 'to-epoch'] },
    { name: 'input', kind: 'string', optional: true },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const input = rest.join(' ');
    try {
      if (mode === 'to-date') {
        const result = epochToDate(input);
        return { text: `${result.utc}\n${result.local}`, kind: 'success' };
      }
      if (mode === 'to-epoch') {
        const result = dateToEpoch(input);
        return { text: `${result.seconds}\n${result.milliseconds}`, kind: 'success' };
      }
      return { text: `epoch: unknown mode '${mode}'. Expected to-date or to-epoch.`, kind: 'error' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
