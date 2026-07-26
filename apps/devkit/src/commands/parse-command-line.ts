const TOKEN_PATTERN = /"([^"]*)"|'([^']*)'|(\S+)/g;

export function parseCommandLine(input: string): string[] {
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}
