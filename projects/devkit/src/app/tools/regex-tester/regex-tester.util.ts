export interface RegexMatch {
  match: string;
  index: number;
}

export interface RegexTestResult {
  matches: RegexMatch[];
  replaced?: string;
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement?: string,
): RegexTestResult {
  const globalFlags = flags.includes('g') ? flags : `${flags}g`;
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, globalFlags);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid regular expression.');
  }

  const matches: RegexMatch[] = [];
  for (const match of input.matchAll(regex)) {
    matches.push({ match: match[0], index: match.index ?? -1 });
  }

  if (replacement === undefined) {
    return { matches };
  }

  const replaceRegex = new RegExp(pattern, globalFlags);
  return { matches, replaced: input.replace(replaceRegex, replacement) };
}
