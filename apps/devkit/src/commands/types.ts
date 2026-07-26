export interface ArgSpec {
  name: string;
  kind: 'string' | 'enum';
  choices?: string[];
  optional?: boolean;
}

export interface CommandResult {
  text: string;
  kind: 'success' | 'error' | 'system';
}

export interface CommandSpec {
  id: string;
  summary: string;
  args: ArgSpec[];
  run(args: string[]): CommandResult | Promise<CommandResult>;
}
