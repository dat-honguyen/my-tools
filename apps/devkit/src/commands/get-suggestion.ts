import type { CommandSpec } from './types';

const BUILTIN_IDS = ['help', 'clear'];

export function getSuggestion(input: string, history: string[], commands: CommandSpec[]): string | null {
  if (input === '') return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.startsWith(input) && entry.length > input.length) {
      return entry.slice(input.length);
    }
  }

  const hasSpace = input.includes(' ');
  if (!hasSpace) {
    const ids = [...commands.map((c) => c.id), ...BUILTIN_IDS];
    const matches = ids.filter((id) => id.startsWith(input) && id.length > input.length);
    return matches.length === 1 ? matches[0].slice(input.length) : null;
  }

  const tokens = input.split(' ');
  const spec = commands.find((c) => c.id === tokens[0]);
  if (!spec) return null;

  const argIndex = tokens.length - 2;
  const argSpec = spec.args[argIndex];
  const currentTyped = tokens[tokens.length - 1];
  if (argSpec?.kind === 'enum' && argSpec.choices) {
    const match = argSpec.choices.find(
      (choice) => choice.startsWith(currentTyped) && choice.length > currentTyped.length,
    );
    if (match) return match.slice(currentTyped.length);
  }
  return null;
}

/**
 * All candidates matching the token currently being typed — used when
 * `getSuggestion` returns null because the prefix is ambiguous (2+ matches),
 * so the terminal can list them instead of staying silent. Ignores history:
 * this only ever looks at command ids or enum choices.
 */
export function getCompletionCandidates(input: string, commands: CommandSpec[]): string[] {
  if (input === '') return [];

  const hasSpace = input.includes(' ');
  if (!hasSpace) {
    const ids = [...commands.map((c) => c.id), ...BUILTIN_IDS];
    return ids.filter((id) => id.startsWith(input));
  }

  const tokens = input.split(' ');
  const spec = commands.find((c) => c.id === tokens[0]);
  if (!spec) return [];

  const argIndex = tokens.length - 2;
  const argSpec = spec.args[argIndex];
  const currentTyped = tokens[tokens.length - 1];
  if (argSpec?.kind === 'enum' && argSpec.choices) {
    return argSpec.choices.filter((choice) => choice.startsWith(currentTyped));
  }
  return [];
}
