import { describe, expect, it } from 'vitest';
import { caseCommand } from './case';

describe('case command', () => {
  it('converts to camelCase', async () => {
    const result = await caseCommand.run(['camel', 'hello world']);
    expect(result).toEqual({ text: 'helloWorld', kind: 'success' });
  });

  it('converts to PascalCase', async () => {
    const result = await caseCommand.run(['pascal', 'hello world']);
    expect(result).toEqual({ text: 'HelloWorld', kind: 'success' });
  });

  it('converts to snake_case', async () => {
    const result = await caseCommand.run(['snake', 'hello world']);
    expect(result).toEqual({ text: 'hello_world', kind: 'success' });
  });

  it('converts to kebab-case', async () => {
    const result = await caseCommand.run(['kebab', 'hello world']);
    expect(result).toEqual({ text: 'hello-world', kind: 'success' });
  });

  it('errors on an unknown mode', async () => {
    const result = await caseCommand.run(['upper', 'hello world']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('upper');
  });
});
