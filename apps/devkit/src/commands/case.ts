import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from '../tools/case-converter/case-converter.util';
import type { CommandSpec } from './types';

export const caseCommand: CommandSpec = {
  id: 'case',
  summary: 'Convert text to camel, pascal, snake, or kebab case',
  args: [
    { name: 'mode', kind: 'enum', choices: ['camel', 'pascal', 'snake', 'kebab'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    switch (mode) {
      case 'camel':
        return { text: toCamelCase(text), kind: 'success' };
      case 'pascal':
        return { text: toPascalCase(text), kind: 'success' };
      case 'snake':
        return { text: toSnakeCase(text), kind: 'success' };
      case 'kebab':
        return { text: toKebabCase(text), kind: 'success' };
      default:
        return {
          text: `case: unknown mode '${mode}'. Expected camel, pascal, snake, or kebab.`,
          kind: 'error',
        };
    }
  },
};
