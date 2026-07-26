import { describe, expect, it } from 'vitest';
import { highlightInput } from './highlight-input';
import type { CommandSpec } from './types';

const guidv4: CommandSpec = {
  id: 'guidv4',
  summary: 'Generate a UUID v4',
  args: [],
  run: () => ({ text: '', kind: 'success' }),
};
const commands = [guidv4];

function joined(value: string) {
  return highlightInput(value, commands)
    .map((s) => s.text)
    .join('');
}

describe('highlightInput', () => {
  it('returns no segments for empty input', () => {
    expect(highlightInput('', commands)).toEqual([]);
  });

  it('reproduces the original string exactly by concatenating segment text', () => {
    for (const value of ['guidv4', '  guidv4  ', 'cp guidv4', 'nope arg1 arg2', 'cp']) {
      expect(joined(value)).toBe(value);
    }
  });

  it('marks a known command as token-command', () => {
    const segments = highlightInput('guidv4', commands);
    expect(segments.find((s) => s.text === 'guidv4')?.className).toBe('token-command');
  });

  it('marks an unknown command as token-unknown', () => {
    const segments = highlightInput('nope', commands);
    expect(segments.find((s) => s.text === 'nope')?.className).toBe('token-unknown');
  });

  it('marks a leading `cp` as token-modifier and colors the command word after it', () => {
    const segments = highlightInput('cp guidv4', commands);
    expect(segments.find((s) => s.text === 'cp')?.className).toBe('token-modifier');
    expect(segments.find((s) => s.text === 'guidv4')?.className).toBe('token-command');
  });

  it('marks an unknown command after `cp` as token-unknown', () => {
    const segments = highlightInput('cp nope', commands);
    expect(segments.find((s) => s.text === 'nope')?.className).toBe('token-unknown');
  });

  it('handles a bare `cp` with nothing after it', () => {
    expect(joined('cp')).toBe('cp');
    const segments = highlightInput('cp', commands);
    expect(segments.find((s) => s.text === 'cp')?.className).toBe('token-modifier');
  });
});
