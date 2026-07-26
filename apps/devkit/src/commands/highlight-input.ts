import type { CommandSpec } from './types';

const BUILTIN_IDS = ['help', 'clear'];

export interface InputSegment {
  text: string;
  className: string;
}

const WORD_PATTERN = /^(\s*)(\S+)([\s\S]*)$/;

function isKnownCommand(word: string, commands: CommandSpec[]): boolean {
  return BUILTIN_IDS.includes(word) || commands.some((c) => c.id === word);
}

/**
 * Splits the raw input (unmodified — same characters/spacing/quotes the user
 * typed) into segments for syntax-highlighted rendering: the `cp` modifier,
 * the command word, and everything else. Concatenating every segment's
 * `text` reproduces `value` exactly, so this can render behind a
 * transparent-text `<input>` without shifting character positions.
 */
export function highlightInput(value: string, commands: CommandSpec[]): InputSegment[] {
  if (value === '') return [];

  const first = WORD_PATTERN.exec(value);
  if (!first) return [{ text: value, className: '' }];
  const [, leadingSpace, firstWord, afterFirst] = first;

  const segments: InputSegment[] = [];
  if (leadingSpace) segments.push({ text: leadingSpace, className: '' });

  if (firstWord === 'cp') {
    segments.push({ text: firstWord, className: 'token-modifier' });

    const second = WORD_PATTERN.exec(afterFirst);
    if (second) {
      const [, spaceBeforeSecond, secondWord, rest] = second;
      segments.push({ text: spaceBeforeSecond, className: '' });
      segments.push({
        text: secondWord,
        className: isKnownCommand(secondWord, commands) ? 'token-command' : 'token-unknown',
      });
      segments.push({ text: rest, className: '' });
      return segments;
    }

    segments.push({ text: afterFirst, className: '' });
    return segments;
  }

  segments.push({
    text: firstWord,
    className: isKnownCommand(firstWord, commands) ? 'token-command' : 'token-unknown',
  });
  segments.push({ text: afterFirst, className: '' });
  return segments;
}
