export interface RegexTestResult {
  matches: RegExpMatchArray[];
  replaced?: string;
}

export function testRegex(pattern: string, flags: string, text: string, replacement?: string): RegexTestResult {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  } catch (err) {
    throw new Error(`Invalid regex: ${err instanceof Error ? err.message : 'could not compile.'}`);
  }
  const matches = Array.from(text.matchAll(re));

  if (replacement === undefined) {
    return { matches };
  }

  const replaceRe = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
  const replaced = text.replace(replaceRe, replacement);
  return { matches, replaced };
}
