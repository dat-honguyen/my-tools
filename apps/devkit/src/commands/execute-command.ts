import { parseCommandLine } from './parse-command-line';
import type { CommandResult, CommandSpec } from './types';

export interface ExecutionResult {
  output: CommandResult[];
  copyText?: string;
}

function usageFor(spec: CommandSpec): string {
  const args = spec.args.map((arg) => (arg.optional ? `[${arg.name}]` : `<${arg.name}>`)).join(' ');
  return args ? `${spec.id} ${args}` : spec.id;
}

export async function executeCommand(input: string, commands: CommandSpec[]): Promise<ExecutionResult> {
  const tokens = parseCommandLine(input);
  if (tokens.length === 0) return { output: [] };

  const copy = tokens[0] === 'cp';
  const rest = copy ? tokens.slice(1) : tokens;
  const [id, ...args] = rest;

  if (!id) {
    return { output: [{ text: "Command not found: . Type 'help' for available commands.", kind: 'error' }] };
  }

  const spec = commands.find((c) => c.id === id);
  if (!spec) {
    return { output: [{ text: `Command not found: ${id}. Type 'help' for available commands.`, kind: 'error' }] };
  }

  const requiredCount = spec.args.filter((arg) => !arg.optional).length;
  if (args.length < requiredCount) {
    return { output: [{ text: `Usage: ${usageFor(spec)}`, kind: 'error' }] };
  }

  const result = await spec.run(args);
  return {
    output: [result],
    copyText: copy && result.kind === 'success' ? (result.copyText ?? result.text) : undefined,
  };
}
