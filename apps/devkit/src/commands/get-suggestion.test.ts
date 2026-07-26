import { describe, expect, it } from 'vitest';
import { getSuggestion } from './get-suggestion';
import type { CommandSpec } from './types';

const hashLike: CommandSpec = {
  id: 'hash',
  summary: 'Hash text',
  args: [{ name: 'algorithm', kind: 'enum', choices: ['md5', 'sha1', 'sha256'] }, { name: 'text', kind: 'string' }],
  run: () => ({ text: '', kind: 'success' }),
};
const hashAliasLike: CommandSpec = {
  id: 'hashify',
  summary: 'Unrelated command sharing a prefix',
  args: [],
  run: () => ({ text: '', kind: 'success' }),
};
const commands = [hashLike, hashAliasLike];

describe('getSuggestion', () => {
  it('returns null for empty input', () => {
    expect(getSuggestion('', [], commands)).toBeNull();
  });

  it('prefers a history match over the static command list', () => {
    expect(getSuggestion('ha', ['hashify extra'], commands)).toBe('shify extra');
  });

  it('suggests a unique command-name completion when no history matches', () => {
    expect(getSuggestion('gu', [], commands)).toBeNull();
    // 'hash' also starts with 'has', so only a longer, hashify-only prefix is unambiguous.
    expect(getSuggestion('hashi', [], commands)).toBe('fy');
  });

  it('returns null when the command prefix is ambiguous', () => {
    expect(getSuggestion('ha', [], commands)).toBeNull();
  });

  it('suggests the first matching enum choice for a known command', () => {
    expect(getSuggestion('hash sh', [], commands)).toBe('a1');
  });

  it('returns null past the last enum arg position', () => {
    expect(getSuggestion('hash md5 hel', [], commands)).toBeNull();
  });
});
