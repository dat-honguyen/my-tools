import { generateUuidV7 } from '../tools/guid-v7/guid-v7.util';
import type { CommandSpec } from './types';

export const guidv7: CommandSpec = {
  id: 'guidv7',
  summary: 'Generate a time-sorted UUID v7',
  args: [],
  run() {
    return { text: generateUuidV7(), kind: 'success' };
  },
};
