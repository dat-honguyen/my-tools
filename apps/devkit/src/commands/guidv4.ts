import type { CommandSpec } from './types';

export const guidv4: CommandSpec = {
  id: 'guidv4',
  summary: 'Generate a random UUID v4',
  args: [],
  run() {
    return { text: crypto.randomUUID(), kind: 'success' };
  },
};
