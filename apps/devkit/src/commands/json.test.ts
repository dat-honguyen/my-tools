import { describe, expect, it } from 'vitest';
import { jsonCommand } from './json';

describe('json command', () => {
  it('pretty-prints JSON', async () => {
    const result = await jsonCommand.run(['pretty', '{"a":1}']);
    expect(result).toEqual({ text: '{\n  "a": 1\n}', kind: 'success' });
  });

  it('minifies JSON', async () => {
    const result = await jsonCommand.run(['minify', '{\n  "a": 1\n}']);
    expect(result).toEqual({ text: '{"a":1}', kind: 'success' });
  });

  it('errors on invalid JSON', async () => {
    const result = await jsonCommand.run(['pretty', '{not json}']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await jsonCommand.run(['compact', '{"a":1}']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('compact');
  });
});
