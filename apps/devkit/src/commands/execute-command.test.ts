import { describe, expect, it } from 'vitest';
import { executeCommand } from './execute-command';
import type { CommandSpec } from './types';

const echo: CommandSpec = {
  id: 'echo',
  summary: 'Echo text back',
  args: [{ name: 'text', kind: 'string' }],
  run(args) {
    return { text: args.join(' '), kind: 'success' };
  },
};

const echoWithCopyText: CommandSpec = {
  id: 'echocopy',
  summary: 'Echo text back with a separate copyText',
  args: [{ name: 'text', kind: 'string' }],
  run(args) {
    return { text: `display: ${args.join(' ')}`, copyText: args.join(' '), kind: 'success' };
  },
};

const fixtures = [echo, echoWithCopyText];

describe('executeCommand', () => {
  it('returns no output for blank input', async () => {
    expect(await executeCommand('', fixtures)).toEqual({ output: [] });
  });

  it('runs a known command', async () => {
    const result = await executeCommand('echo hello world', fixtures);
    expect(result).toEqual({ output: [{ text: 'hello world', kind: 'success' }] });
  });

  it('reports an unknown command', async () => {
    const result = await executeCommand('nope', fixtures);
    expect(result.output[0].kind).toBe('error');
    expect(result.output[0].text).toContain('nope');
  });

  it('reports missing required args', async () => {
    const result = await executeCommand('echo', fixtures);
    expect(result.output[0].kind).toBe('error');
    expect(result.output[0].text).toContain('Usage: echo <text>');
  });

  it('strips a leading cp and returns copyText on success', async () => {
    const result = await executeCommand('cp echo hi', fixtures);
    expect(result).toEqual({ output: [{ text: 'hi', kind: 'success' }], copyText: 'hi' });
  });

  it('does not set copyText when the command errors', async () => {
    const result = await executeCommand('cp echo', fixtures);
    expect(result.copyText).toBeUndefined();
  });

  it('prefers a result-provided copyText over its display text', async () => {
    const result = await executeCommand('cp echocopy hi there', fixtures);
    expect(result.output).toEqual([{ text: 'display: hi there', copyText: 'hi there', kind: 'success' }]);
    expect(result.copyText).toBe('hi there');
  });
});
