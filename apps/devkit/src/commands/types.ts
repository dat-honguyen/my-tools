export interface ArgSpec {
  name: string;
  kind: 'string' | 'enum';
  choices?: string[];
  optional?: boolean;
}

export interface CommandResult {
  text: string;
  kind: 'success' | 'error' | 'system';
  /** When set, `cp <command>` copies this instead of `text` (e.g. `date` displays a multi-line breakdown but copies only the ISO string). */
  copyText?: string;
}

export interface CommandSpec {
  id: string;
  summary: string;
  args: ArgSpec[];
  run(args: string[]): CommandResult | Promise<CommandResult>;
}
