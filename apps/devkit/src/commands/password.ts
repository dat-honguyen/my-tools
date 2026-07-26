import { generatePassword, type PasswordCharset } from '../tools/password-generator/password-generator.util';
import type { CommandSpec } from './types';

const DEFAULT_LENGTH = 16;
const CHARSET_CHOICES: PasswordCharset[] = ['all', 'alnum', 'alpha', 'numeric'];

export const password: CommandSpec = {
  id: 'password',
  summary: 'Generate a random password (default 16 chars, all character types)',
  args: [
    { name: 'length', kind: 'string', optional: true },
    { name: 'charset', kind: 'enum', choices: CHARSET_CHOICES, optional: true },
  ],
  run(args) {
    const [lengthArg, charsetArg] = args;
    const length = lengthArg === undefined ? DEFAULT_LENGTH : Number(lengthArg);
    if (!Number.isInteger(length) || length < 1 || length > 256) {
      return { text: `password: length must be an integer between 1 and 256, got '${lengthArg}'.`, kind: 'error' };
    }

    if (charsetArg !== undefined && !CHARSET_CHOICES.includes(charsetArg as PasswordCharset)) {
      return {
        text: `password: unknown charset '${charsetArg}'. Expected all, alnum, alpha, or numeric.`,
        kind: 'error',
      };
    }

    const charset = (charsetArg as PasswordCharset | undefined) ?? 'all';
    return { text: generatePassword(length, charset), kind: 'success' };
  },
};
