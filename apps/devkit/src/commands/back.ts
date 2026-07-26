import type { CommandSpec } from './types';

export const back: CommandSpec = {
  id: 'back',
  summary: 'Return to the portfolio site',
  args: [],
  run() {
    setTimeout(() => {
      window.location.assign('/');
    }, 300);
    return { text: 'Returning to portfolio...', kind: 'system' };
  },
};
