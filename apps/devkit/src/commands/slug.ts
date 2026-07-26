import { slugify } from '../tools/slugify/slugify.util';
import type { CommandSpec } from './types';

export const slug: CommandSpec = {
  id: 'slug',
  summary: 'Slugify text into a URL-friendly, lowercase, dash-separated form',
  args: [{ name: 'text', kind: 'string' }],
  run(args) {
    return { text: slugify(args.join(' ')), kind: 'success' };
  },
};
