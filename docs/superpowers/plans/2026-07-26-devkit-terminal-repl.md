# DevKit Terminal REPL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `apps/devkit`'s sidebar + detail-panel UI with a literal terminal REPL (matching `apps/devkit/gemini-code-1785050498048.html`) where all 11 tools are commands, with Tab-accepted ghost-text autocomplete (commands, history, enum args) and readline-style history navigation.

**Architecture:** A declarative command registry (`commands/*.ts`, one module per tool) driven by a generic tokenizer, executor, and suggestion engine; a single `Terminal.tsx` component replaces `App.tsx` as the whole app. Existing `*.util.ts` pure functions are reused unchanged; existing presentational `*.tsx` tool components, `App.tsx`, `tool-registry.ts`, and `CopyButton.tsx` are deleted.

**Tech Stack:** React 19, TypeScript, Vitest + @testing-library/react + @testing-library/user-event, esbuild/Native Federation (unchanged), jsdom.

## Global Constraints

- No new dependencies — same React/esbuild/Native Federation/Vitest stack as today.
- All 11 existing `*.util.ts` / `*.util.test.ts` files (and `md5.ts`/`md5.test.ts`) stay unmodified.
- `dk-devkit-app` custom element contract, `bootstrap.tsx`, `main.ts`, `federation.config.js`, and `build/build.ts` are untouched.
- Multi-field commands (regex, hash, base64, url, case, json) take quoted args on one line — no interactive sub-prompts, no multi-line paste mode.
- Run tests from `apps/devkit` (`cd apps/devkit && npx vitest run <path>`), since that's where `vitest.config.ts`/`vitest.setup.ts` live.

---

### Task 1: Command types + tokenizer

**Files:**
- Create: `apps/devkit/src/commands/types.ts`
- Create: `apps/devkit/src/commands/parse-command-line.ts`
- Test: `apps/devkit/src/commands/parse-command-line.test.ts`

**Interfaces:**
- Produces: `ArgSpec { name: string; kind: 'string' | 'enum'; choices?: string[]; optional?: boolean }`, `CommandResult { text: string; kind: 'success' | 'error' | 'system' }`, `CommandSpec { id: string; summary: string; args: ArgSpec[]; run(args: string[]): CommandResult | Promise<CommandResult> }`, `parseCommandLine(input: string): string[]`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/parse-command-line.test.ts
import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './parse-command-line';

describe('parseCommandLine', () => {
  it('returns an empty array for blank input', () => {
    expect(parseCommandLine('')).toEqual([]);
    expect(parseCommandLine('   ')).toEqual([]);
  });

  it('splits plain whitespace-separated tokens', () => {
    expect(parseCommandLine('hash sha256 hello')).toEqual(['hash', 'sha256', 'hello']);
  });

  it('keeps double-quoted spans as one token', () => {
    expect(parseCommandLine('hash sha256 "hello world"')).toEqual(['hash', 'sha256', 'hello world']);
  });

  it('keeps single-quoted spans as one token', () => {
    expect(parseCommandLine("json pretty '{\"a\": 1}'")).toEqual(['json', 'pretty', '{"a": 1}']);
  });

  it('collapses repeated whitespace between tokens', () => {
    expect(parseCommandLine('  hash   sha256  hello  ')).toEqual(['hash', 'sha256', 'hello']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/parse-command-line.test.ts`
Expected: FAIL — `parse-command-line.ts` does not exist yet.

- [ ] **Step 3: Write the types and tokenizer**

```ts
// apps/devkit/src/commands/types.ts
export interface ArgSpec {
  name: string;
  kind: 'string' | 'enum';
  choices?: string[];
  optional?: boolean;
}

export interface CommandResult {
  text: string;
  kind: 'success' | 'error' | 'system';
}

export interface CommandSpec {
  id: string;
  summary: string;
  args: ArgSpec[];
  run(args: string[]): CommandResult | Promise<CommandResult>;
}
```

```ts
// apps/devkit/src/commands/parse-command-line.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/parse-command-line.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/types.ts apps/devkit/src/commands/parse-command-line.ts apps/devkit/src/commands/parse-command-line.test.ts
git commit -m "Add command types and CLI tokenizer for DevKit terminal"
```

---

### Task 2: `guidv4` and `guidv7` commands

**Files:**
- Create: `apps/devkit/src/commands/guidv4.ts`
- Create: `apps/devkit/src/commands/guidv7.ts`
- Test: `apps/devkit/src/commands/guidv4.test.ts`
- Test: `apps/devkit/src/commands/guidv7.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` from Task 1 (`./types`); `generateUuidV7` from `../tools/guid-v7/guid-v7.util` (existing, unchanged).
- Produces: `guidv4: CommandSpec`, `guidv7: CommandSpec`, both `id` matching their filename.

- [ ] **Step 1: Write the failing tests**

```ts
// apps/devkit/src/commands/guidv4.test.ts
import { describe, expect, it } from 'vitest';
import { guidv4 } from './guidv4';

describe('guidv4 command', () => {
  it('returns a v4 UUID with no args', async () => {
    const result = await guidv4.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
```

```ts
// apps/devkit/src/commands/guidv7.test.ts
import { describe, expect, it } from 'vitest';
import { guidv7 } from './guidv7';

describe('guidv7 command', () => {
  it('returns a v7 UUID with no args', async () => {
    const result = await guidv7.run([]);
    expect(result.kind).toBe('success');
    expect(result.text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/devkit && npx vitest run src/commands/guidv4.test.ts src/commands/guidv7.test.ts`
Expected: FAIL — modules don't exist.

- [ ] **Step 3: Write the commands**

```ts
// apps/devkit/src/commands/guidv4.ts
import type { CommandSpec } from './types';

export const guidv4: CommandSpec = {
  id: 'guidv4',
  summary: 'Generate a random UUID v4',
  args: [],
  run() {
    return { text: crypto.randomUUID(), kind: 'success' };
  },
};
```

```ts
// apps/devkit/src/commands/guidv7.ts
import { generateUuidV7 } from '../tools/guid-v7/guid-v7.util';
import type { CommandSpec } from './types';

export const guidv7: CommandSpec = {
  id: 'guidv7',
  summary: 'Generate a time-sorted UUID v7',
  args: [],
  run() {
    return { text: generateUuidV7(), kind: 'success' };
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/devkit && npx vitest run src/commands/guidv4.test.ts src/commands/guidv7.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/guidv4.ts apps/devkit/src/commands/guidv7.ts apps/devkit/src/commands/guidv4.test.ts apps/devkit/src/commands/guidv7.test.ts
git commit -m "Add guidv4 and guidv7 DevKit terminal commands"
```

---

### Task 3: `hash` command

**Files:**
- Create: `apps/devkit/src/commands/hash.ts`
- Test: `apps/devkit/src/commands/hash.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `sha` from `../tools/hash-generator/hash-generator.util`; `md5` from `../tools/hash-generator/md5` (both existing, unchanged).
- Produces: `hash: CommandSpec`, `id: 'hash'`, `args: [{name:'algorithm',kind:'enum',choices:['md5','sha1','sha256']}, {name:'text',kind:'string'}]`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/hash.test.ts
import { describe, expect, it } from 'vitest';
import { hash } from './hash';

describe('hash command', () => {
  it('computes md5', async () => {
    const result = await hash.run(['md5', 'hello']);
    expect(result).toEqual({ text: '5d41402abc4b2a76b9719d911017c592', kind: 'success' });
  });

  it('computes sha1', async () => {
    const result = await hash.run(['sha1', 'hello']);
    expect(result.kind).toBe('success');
    expect(result.text).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('computes sha256', async () => {
    const result = await hash.run(['sha256', 'hello']);
    expect(result.kind).toBe('success');
    expect(result.text).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('joins unquoted multi-word text', async () => {
    const result = await hash.run(['md5', 'hello', 'world']);
    expect(result).toEqual({ text: '5eb63bbbe01eeed093cb22bb8f5acdc3', kind: 'success' });
  });

  it('errors on an unknown algorithm', async () => {
    const result = await hash.run(['sha512', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('sha512');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/hash.test.ts`
Expected: FAIL — `hash.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/hash.ts
import { sha } from '../tools/hash-generator/hash-generator.util';
import { md5 } from '../tools/hash-generator/md5';
import type { CommandSpec } from './types';

export const hash: CommandSpec = {
  id: 'hash',
  summary: 'Hash text with md5, sha1, or sha256',
  args: [
    { name: 'algorithm', kind: 'enum', choices: ['md5', 'sha1', 'sha256'] },
    { name: 'text', kind: 'string' },
  ],
  async run(args) {
    const [algorithm, ...rest] = args;
    const text = rest.join(' ');
    if (algorithm === 'md5') return { text: md5(text), kind: 'success' };
    if (algorithm === 'sha1') return { text: await sha('SHA-1', text), kind: 'success' };
    if (algorithm === 'sha256') return { text: await sha('SHA-256', text), kind: 'success' };
    return {
      text: `hash: unknown algorithm '${algorithm}'. Expected md5, sha1, or sha256.`,
      kind: 'error',
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/hash.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/hash.ts apps/devkit/src/commands/hash.test.ts
git commit -m "Add hash DevKit terminal command"
```

---

### Task 4: `base64` command

**Files:**
- Create: `apps/devkit/src/commands/base64.ts`
- Test: `apps/devkit/src/commands/base64.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `encodeBase64`, `decodeBase64` from `../tools/base64-tool/base64-tool.util` (existing).
- Produces: `base64Command: CommandSpec`, `id: 'base64'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/base64.test.ts
import { describe, expect, it } from 'vitest';
import { base64Command } from './base64';

describe('base64 command', () => {
  it('encodes text', async () => {
    const result = await base64Command.run(['encode', 'hello']);
    expect(result).toEqual({ text: 'aGVsbG8=', kind: 'success' });
  });

  it('decodes text', async () => {
    const result = await base64Command.run(['decode', 'aGVsbG8=']);
    expect(result).toEqual({ text: 'hello', kind: 'success' });
  });

  it('errors on invalid base64', async () => {
    const result = await base64Command.run(['decode', 'not-valid-base64!!']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await base64Command.run(['reverse', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('reverse');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/base64.test.ts`
Expected: FAIL — `base64.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/base64.ts
import { decodeBase64, encodeBase64 } from '../tools/base64-tool/base64-tool.util';
import type { CommandSpec } from './types';

export const base64Command: CommandSpec = {
  id: 'base64',
  summary: 'Encode or decode Base64 text',
  args: [
    { name: 'mode', kind: 'enum', choices: ['encode', 'decode'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    try {
      if (mode === 'encode') return { text: encodeBase64(text), kind: 'success' };
      if (mode === 'decode') return { text: decodeBase64(text), kind: 'success' };
      return {
        text: `base64: unknown mode '${mode}'. Expected encode or decode.`,
        kind: 'error',
      };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/base64.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/base64.ts apps/devkit/src/commands/base64.test.ts
git commit -m "Add base64 DevKit terminal command"
```

---

### Task 5: `url` command

**Files:**
- Create: `apps/devkit/src/commands/url.ts`
- Test: `apps/devkit/src/commands/url.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `encodeUrl`, `decodeUrl` from `../tools/url-codec/url-codec.util` (existing).
- Produces: `url: CommandSpec`, `id: 'url'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/url.test.ts
import { describe, expect, it } from 'vitest';
import { url } from './url';

describe('url command', () => {
  it('encodes text', async () => {
    const result = await url.run(['encode', 'a b/c']);
    expect(result).toEqual({ text: 'a%20b%2Fc', kind: 'success' });
  });

  it('decodes text', async () => {
    const result = await url.run(['decode', 'a%20b%2Fc']);
    expect(result).toEqual({ text: 'a b/c', kind: 'success' });
  });

  it('errors on invalid percent-encoding', async () => {
    const result = await url.run(['decode', '%E0%A4%A']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await url.run(['reverse', 'hello']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('reverse');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/url.test.ts`
Expected: FAIL — `url.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/url.ts
import { decodeUrl, encodeUrl } from '../tools/url-codec/url-codec.util';
import type { CommandSpec } from './types';

export const url: CommandSpec = {
  id: 'url',
  summary: 'URL-encode or decode text',
  args: [
    { name: 'mode', kind: 'enum', choices: ['encode', 'decode'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    try {
      if (mode === 'encode') return { text: encodeUrl(text), kind: 'success' };
      if (mode === 'decode') return { text: decodeUrl(text), kind: 'success' };
      return { text: `url: unknown mode '${mode}'. Expected encode or decode.`, kind: 'error' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/url.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/url.ts apps/devkit/src/commands/url.test.ts
git commit -m "Add url DevKit terminal command"
```

---

### Task 6: `case` command

**Files:**
- Create: `apps/devkit/src/commands/case.ts`
- Test: `apps/devkit/src/commands/case.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `toCamelCase`, `toPascalCase`, `toSnakeCase`, `toKebabCase` from `../tools/case-converter/case-converter.util` (existing).
- Produces: `caseCommand: CommandSpec`, `id: 'case'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/case.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/case.test.ts`
Expected: FAIL — `case.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/case.ts
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from '../tools/case-converter/case-converter.util';
import type { CommandSpec } from './types';

export const caseCommand: CommandSpec = {
  id: 'case',
  summary: 'Convert text to camel, pascal, snake, or kebab case',
  args: [
    { name: 'mode', kind: 'enum', choices: ['camel', 'pascal', 'snake', 'kebab'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    switch (mode) {
      case 'camel':
        return { text: toCamelCase(text), kind: 'success' };
      case 'pascal':
        return { text: toPascalCase(text), kind: 'success' };
      case 'snake':
        return { text: toSnakeCase(text), kind: 'success' };
      case 'kebab':
        return { text: toKebabCase(text), kind: 'success' };
      default:
        return {
          text: `case: unknown mode '${mode}'. Expected camel, pascal, snake, or kebab.`,
          kind: 'error',
        };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/case.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/case.ts apps/devkit/src/commands/case.test.ts
git commit -m "Add case DevKit terminal command"
```

---

### Task 7: `jwt` command

**Files:**
- Create: `apps/devkit/src/commands/jwt.ts`
- Test: `apps/devkit/src/commands/jwt.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `decodeJwt` from `../tools/jwt-decoder/jwt-decoder.util` (existing).
- Produces: `jwt: CommandSpec`, `id: 'jwt'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/jwt.test.ts
import { describe, expect, it } from 'vitest';
import { jwt } from './jwt';

describe('jwt command', () => {
  it('decodes header and payload', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9lIn0.dGVzdA';
    const result = await jwt.run([token]);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('"alg": "HS256"');
    expect(result.text).toContain('"sub": "123"');
  });

  it('errors on a malformed token', async () => {
    const result = await jwt.run(['not-a-jwt']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('JWT');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/jwt.test.ts`
Expected: FAIL — `jwt.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/jwt.ts
import { decodeJwt } from '../tools/jwt-decoder/jwt-decoder.util';
import type { CommandSpec } from './types';

export const jwt: CommandSpec = {
  id: 'jwt',
  summary: "Decode a JWT's header and payload (signature not verified)",
  args: [{ name: 'token', kind: 'string' }],
  run(args) {
    const token = args.join(' ');
    try {
      const { header, payload } = decodeJwt(token);
      const text = `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}`;
      return { text, kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/jwt.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/jwt.ts apps/devkit/src/commands/jwt.test.ts
git commit -m "Add jwt DevKit terminal command"
```

---

### Task 8: `json` command

**Files:**
- Create: `apps/devkit/src/commands/json.ts`
- Test: `apps/devkit/src/commands/json.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `formatJson` from `../tools/json-formatter/json-formatter.util` (existing).
- Produces: `jsonCommand: CommandSpec`, `id: 'json'`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/json.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/json.test.ts`
Expected: FAIL — `json.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/json.ts
import { formatJson } from '../tools/json-formatter/json-formatter.util';
import type { CommandSpec } from './types';

export const jsonCommand: CommandSpec = {
  id: 'json',
  summary: 'Pretty-print or minify JSON',
  args: [
    { name: 'mode', kind: 'enum', choices: ['pretty', 'minify'] },
    { name: 'text', kind: 'string' },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');
    if (mode !== 'pretty' && mode !== 'minify') {
      return { text: `json: unknown mode '${mode}'. Expected pretty or minify.`, kind: 'error' };
    }
    try {
      return { text: formatJson(text, mode), kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/json.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/json.ts apps/devkit/src/commands/json.test.ts
git commit -m "Add json DevKit terminal command"
```

---

### Task 9: `regex` command

**Files:**
- Create: `apps/devkit/src/commands/regex.ts`
- Test: `apps/devkit/src/commands/regex.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `testRegex` from `../tools/regex-tester/regex-tester.util` (existing).
- Produces: `regex: CommandSpec`, `id: 'regex'`, `args` positional (`pattern`, `flags`, `text`, optional `replacement`) — no trailing-join, since all four fields are independently meaningful and must be quoted if they contain spaces.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/regex.test.ts
import { describe, expect, it } from 'vitest';
import { regex } from './regex';

describe('regex command', () => {
  it('counts matches', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22 c333']);
    expect(result).toEqual({ text: '3 match(es)', kind: 'success' });
  });

  it('replaces when a replacement is given', async () => {
    const result = await regex.run(['\\d+', 'g', 'a1 b22', 'X']);
    expect(result).toEqual({ text: '2 match(es)\naX bX', kind: 'success' });
  });

  it('errors on an invalid pattern', async () => {
    const result = await regex.run(['(', 'g', 'text']);
    expect(result.kind).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/regex.test.ts`
Expected: FAIL — `regex.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/regex.ts
import { testRegex } from '../tools/regex-tester/regex-tester.util';
import type { CommandSpec } from './types';

export const regex: CommandSpec = {
  id: 'regex',
  summary: 'Test a regex pattern against text, with an optional replacement',
  args: [
    { name: 'pattern', kind: 'string' },
    { name: 'flags', kind: 'string' },
    { name: 'text', kind: 'string' },
    { name: 'replacement', kind: 'string', optional: true },
  ],
  run(args) {
    const [pattern, flags, text, replacement] = args;
    try {
      const result = testRegex(pattern, flags, text, replacement);
      const lines = [`${result.matches.length} match(es)`];
      if (result.replaced !== undefined) lines.push(result.replaced);
      return { text: lines.join('\n'), kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/regex.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/regex.ts apps/devkit/src/commands/regex.test.ts
git commit -m "Add regex DevKit terminal command"
```

---

### Task 10: `date` command

**Files:**
- Create: `apps/devkit/src/commands/date.ts`
- Test: `apps/devkit/src/commands/date.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `convertDateTime` from `../tools/date-time-converter/date-time-converter.util` (existing).
- Produces: `date: CommandSpec`, `id: 'date'`, `args: [{name:'input',kind:'string',optional:true}, {name:'timeZone',kind:'string',optional:true}]`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/date.test.ts
import { describe, expect, it } from 'vitest';
import { date } from './date';

describe('date command', () => {
  it('converts an ISO date in UTC by default', async () => {
    const result = await date.run(['2024-01-15T12:00:00Z']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('2024-01-15T12:00:00.000Z');
    expect(result.text).toContain('(UTC)');
  });

  it('converts using a given timezone', async () => {
    const result = await date.run(['2024-01-15T12:00:00Z', 'America/New_York']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('(America/New_York)');
  });

  it('errors on an invalid date', async () => {
    const result = await date.run(['not-a-date']);
    expect(result.kind).toBe('error');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/date.test.ts`
Expected: FAIL — `date.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/date.ts
import { convertDateTime } from '../tools/date-time-converter/date-time-converter.util';
import type { CommandSpec } from './types';

export const date: CommandSpec = {
  id: 'date',
  summary: 'Convert a date (or now) to ISO, a timezone, and its UTC offset',
  args: [
    { name: 'input', kind: 'string', optional: true },
    { name: 'timeZone', kind: 'string', optional: true },
  ],
  run(args) {
    const [input = '', timeZone = 'UTC'] = args;
    try {
      const result = convertDateTime(input, timeZone);
      return { text: `${result.iso}\n${result.zoned} (${timeZone})\n${result.offset}`, kind: 'success' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/date.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/date.ts apps/devkit/src/commands/date.test.ts
git commit -m "Add date DevKit terminal command"
```

---

### Task 11: `epoch` command

**Files:**
- Create: `apps/devkit/src/commands/epoch.ts`
- Test: `apps/devkit/src/commands/epoch.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1); `epochToDate`, `dateToEpoch` from `../tools/epoch-converter/epoch-converter.util` (existing).
- Produces: `epoch: CommandSpec`, `id: 'epoch'`, `args: [{name:'mode',kind:'enum',choices:['to-date','to-epoch']}, {name:'input',kind:'string',optional:true}]`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/epoch.test.ts
import { describe, expect, it } from 'vitest';
import { epoch } from './epoch';

describe('epoch command', () => {
  it('converts epoch seconds to a date', async () => {
    const result = await epoch.run(['to-date', '1705320000']);
    expect(result.kind).toBe('success');
    expect(result.text).toContain('2024-01-15T12:00:00.000Z');
  });

  it('converts a date to epoch', async () => {
    const result = await epoch.run(['to-epoch', '2024-01-15T12:00:00Z']);
    expect(result).toEqual({ text: '1705320000\n1705320000000', kind: 'success' });
  });

  it('errors on a non-numeric epoch value', async () => {
    const result = await epoch.run(['to-date', 'abc']);
    expect(result.kind).toBe('error');
  });

  it('errors on an unknown mode', async () => {
    const result = await epoch.run(['sideways', '123']);
    expect(result.kind).toBe('error');
    expect(result.text).toContain('sideways');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/epoch.test.ts`
Expected: FAIL — `epoch.ts` doesn't exist.

- [ ] **Step 3: Write the command**

```ts
// apps/devkit/src/commands/epoch.ts
import { dateToEpoch, epochToDate } from '../tools/epoch-converter/epoch-converter.util';
import type { CommandSpec } from './types';

export const epoch: CommandSpec = {
  id: 'epoch',
  summary: 'Convert epoch to a date, or a date to epoch seconds/ms',
  args: [
    { name: 'mode', kind: 'enum', choices: ['to-date', 'to-epoch'] },
    { name: 'input', kind: 'string', optional: true },
  ],
  run(args) {
    const [mode, ...rest] = args;
    const input = rest.join(' ');
    try {
      if (mode === 'to-date') {
        const result = epochToDate(input);
        return { text: `${result.utc}\n${result.local}`, kind: 'success' };
      }
      if (mode === 'to-epoch') {
        const result = dateToEpoch(input);
        return { text: `${result.seconds}\n${result.milliseconds}`, kind: 'success' };
      }
      return { text: `epoch: unknown mode '${mode}'. Expected to-date or to-epoch.`, kind: 'error' };
    } catch (err) {
      return { text: err instanceof Error ? err.message : 'Something went wrong.', kind: 'error' };
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/epoch.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/epoch.ts apps/devkit/src/commands/epoch.test.ts
git commit -m "Add epoch DevKit terminal command"
```

---

### Task 12: Command registry + executor

**Files:**
- Create: `apps/devkit/src/commands/index.ts`
- Create: `apps/devkit/src/commands/execute-command.ts`
- Test: `apps/devkit/src/commands/execute-command.test.ts`

**Interfaces:**
- Consumes: all 11 `CommandSpec`s from Tasks 2–11; `parseCommandLine` (Task 1).
- Produces: `COMMANDS: CommandSpec[]` (11 entries); `ExecutionResult { output: CommandResult[]; copyText?: string }`; `executeCommand(input: string, commands: CommandSpec[]): Promise<ExecutionResult>`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/execute-command.test.ts
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

const fixtures = [echo];

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/execute-command.test.ts`
Expected: FAIL — `execute-command.ts` doesn't exist.

- [ ] **Step 3: Write the registry and executor**

```ts
// apps/devkit/src/commands/index.ts
import { guidv4 } from './guidv4';
import { guidv7 } from './guidv7';
import { hash } from './hash';
import { base64Command } from './base64';
import { url } from './url';
import { caseCommand } from './case';
import { jwt } from './jwt';
import { jsonCommand } from './json';
import { regex } from './regex';
import { date } from './date';
import { epoch } from './epoch';
import type { CommandSpec } from './types';

export const COMMANDS: CommandSpec[] = [
  guidv4,
  guidv7,
  hash,
  base64Command,
  url,
  caseCommand,
  jwt,
  jsonCommand,
  regex,
  date,
  epoch,
];
```

```ts
// apps/devkit/src/commands/execute-command.ts
import { parseCommandLine } from './parse-command-line';
import type { CommandResult, CommandSpec } from './types';

export interface ExecutionResult {
  output: CommandResult[];
  copyText?: string;
}

function usageFor(spec: CommandSpec): string {
  const args = spec.args.map((arg) => (arg.optional ? `[${arg.name}]` : `<${arg.name}>`)).join(' ');
  return args ? `${spec.id} ${args}` : spec.id;
}

export async function executeCommand(input: string, commands: CommandSpec[]): Promise<ExecutionResult> {
  const tokens = parseCommandLine(input);
  if (tokens.length === 0) return { output: [] };

  const copy = tokens[0] === 'cp';
  const rest = copy ? tokens.slice(1) : tokens;
  const [id, ...args] = rest;

  if (!id) {
    return { output: [{ text: "Command not found: . Type 'help' for available commands.", kind: 'error' }] };
  }

  const spec = commands.find((c) => c.id === id);
  if (!spec) {
    return { output: [{ text: `Command not found: ${id}. Type 'help' for available commands.`, kind: 'error' }] };
  }

  const requiredCount = spec.args.filter((arg) => !arg.optional).length;
  if (args.length < requiredCount) {
    return { output: [{ text: `Usage: ${usageFor(spec)}`, kind: 'error' }] };
  }

  const result = await spec.run(args);
  return {
    output: [result],
    copyText: copy && result.kind === 'success' ? result.text : undefined,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/execute-command.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/index.ts apps/devkit/src/commands/execute-command.ts apps/devkit/src/commands/execute-command.test.ts
git commit -m "Add DevKit terminal command registry and executor"
```

---

### Task 13: Ghost-text suggestion engine

**Files:**
- Create: `apps/devkit/src/commands/get-suggestion.ts`
- Test: `apps/devkit/src/commands/get-suggestion.test.ts`

**Interfaces:**
- Consumes: `CommandSpec` (Task 1).
- Produces: `getSuggestion(input: string, history: string[], commands: CommandSpec[]): string | null` — the remainder string to append to `input`, or `null`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/commands/get-suggestion.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/commands/get-suggestion.test.ts`
Expected: FAIL — `get-suggestion.ts` doesn't exist.

- [ ] **Step 3: Write the suggestion engine**

```ts
// apps/devkit/src/commands/get-suggestion.ts
import type { CommandSpec } from './types';

const BUILTIN_IDS = ['help', 'clear'];

export function getSuggestion(input: string, history: string[], commands: CommandSpec[]): string | null {
  if (input === '') return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.startsWith(input) && entry.length > input.length) {
      return entry.slice(input.length);
    }
  }

  const hasSpace = input.includes(' ');
  if (!hasSpace) {
    const ids = [...commands.map((c) => c.id), ...BUILTIN_IDS];
    const matches = ids.filter((id) => id.startsWith(input) && id.length > input.length);
    return matches.length === 1 ? matches[0].slice(input.length) : null;
  }

  const tokens = input.split(' ');
  const spec = commands.find((c) => c.id === tokens[0]);
  if (!spec) return null;

  const argIndex = tokens.length - 2;
  const argSpec = spec.args[argIndex];
  const currentTyped = tokens[tokens.length - 1];
  if (argSpec?.kind === 'enum' && argSpec.choices) {
    const match = argSpec.choices.find(
      (choice) => choice.startsWith(currentTyped) && choice.length > currentTyped.length,
    );
    if (match) return match.slice(currentTyped.length);
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/commands/get-suggestion.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/commands/get-suggestion.ts apps/devkit/src/commands/get-suggestion.test.ts
git commit -m "Add ghost-text suggestion engine for DevKit terminal"
```

---

### Task 14: Clipboard helper

**Files:**
- Create: `apps/devkit/src/shared/clipboard.ts`
- Test: `apps/devkit/src/shared/clipboard.test.ts`
- Delete: `apps/devkit/src/shared/CopyButton.tsx`
- Delete: `apps/devkit/src/shared/CopyButton.test.tsx`
- Delete: `apps/devkit/src/shared/result.ts` (the `tryResult` helper it exports has no remaining callers once Task 20 deletes the last `*.tsx` tool component that used it)

**Interfaces:**
- Produces: `copyToClipboard(text: string): Promise<boolean>` — resolves `true` on success (via `navigator.clipboard` or the `execCommand` fallback), `false` if both fail.

- [ ] **Step 1: Write the failing test**

```ts
// apps/devkit/src/shared/clipboard.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns true when the Clipboard API succeeds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    vi.spyOn(document, 'execCommand').mockReturnValue(true);
    await expect(copyToClipboard('hello')).resolves.toBe(true);
  });

  it('returns false when both the Clipboard API and the fallback fail', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('no selection');
    });
    await expect(copyToClipboard('hello')).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/shared/clipboard.test.ts`
Expected: FAIL — `clipboard.ts` doesn't exist.

- [ ] **Step 3: Write the helper, delete `CopyButton` and `result.ts`**

```ts
// apps/devkit/src/shared/clipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch {
      return false;
    }
  }
}
```

Delete `apps/devkit/src/shared/CopyButton.tsx`, `apps/devkit/src/shared/CopyButton.test.tsx`, and
`apps/devkit/src/shared/result.ts` (leave the deletion of files that still import them, if any
remain at this point in the plan, to Task 20 — check with the grep below before deleting `result.ts`).

Run: `cd apps/devkit && grep -rl "shared/result" src --include=*.ts --include=*.tsx`
If this lists any file other than `result.ts` itself, do not delete `result.ts` yet — leave it for
Task 20 instead, where its last caller is removed.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/shared/clipboard.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add -A apps/devkit/src/shared
git commit -m "Add clipboard helper, remove CopyButton for DevKit terminal"
```

---

### Task 15: Terminal stylesheet

**Files:**
- Create: `apps/devkit/src/styles/terminal.css`
- Modify: `apps/devkit/src/styles/theme.css` (remove sidebar/detail-panel-only rules)
- Delete: `apps/devkit/src/styles/tool-panel.css`

No test for this task (pure CSS) — visually verified once `Terminal.tsx` (Task 16) renders it.

- [ ] **Step 1: Trim `theme.css` to just the chrome + design tokens**

Remove the following rule blocks from `apps/devkit/src/styles/theme.css` (they styled the
sidebar/detail-panel layout that no longer exists): `.devkit-body`, `.devkit-sidebar`,
`.devkit-filter`, `.devkit-tool-list`, `.devkit-tool-item`, `.devkit-tool-item:hover`,
`.devkit-tool-item.active`, `.devkit-detail`, `.devkit-empty-state`. Keep everything else
(`:host` custom properties, `*`, `.devkit-terminal`, `.devkit-terminal-header`,
`.devkit-window-controls`, `.devkit-control` + its `.close`/`.minimize`/`.maximize` variants,
`.devkit-terminal-title`) unchanged.

- [ ] **Step 2: Delete `tool-panel.css`**

```bash
git rm apps/devkit/src/styles/tool-panel.css
```

- [ ] **Step 3: Write `terminal.css`**

```css
/* apps/devkit/src/styles/terminal.css */
.devkit-output {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.output-line {
  margin-bottom: 8px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.output-line.success {
  color: var(--color-success);
}
.output-line.error {
  color: var(--color-error);
}
.output-line.system {
  color: var(--color-primary);
}
.output-line.warning {
  color: var(--color-warning);
}
.output-line.echo {
  color: var(--color-text);
}

.input-line {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.prompt {
  color: var(--color-success);
  font-weight: bold;
  margin-right: 8px;
  white-space: nowrap;
}

.command-input-wrapper {
  position: relative;
  flex: 1;
}

.ghost-suggestion {
  position: absolute;
  inset: 0;
  pointer-events: none;
  white-space: pre;
  font: inherit;
}

.ghost-typed {
  color: transparent;
}

.ghost-rest {
  color: var(--color-text-muted);
}

.command-input {
  position: relative;
  background: transparent;
  border: none;
  color: var(--color-text);
  font: inherit;
  font-size: 1rem;
  width: 100%;
  outline: none;
  padding: 0;
  caret-color: var(--color-warning);
}

/* Scrollbar styling, matching the pasted mockup */
.devkit-output::-webkit-scrollbar {
  width: 8px;
}
.devkit-output::-webkit-scrollbar-track {
  background: var(--color-surface);
}
.devkit-output::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}
.devkit-output::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/devkit/src/styles/terminal.css apps/devkit/src/styles/theme.css
git commit -m "Add terminal output/input styles, trim sidebar styles from theme.css"
```

---

### Task 16: `Terminal.tsx` component

**Files:**
- Create: `apps/devkit/src/Terminal.tsx`
- Test: `apps/devkit/src/Terminal.test.tsx`

**Interfaces:**
- Consumes: `COMMANDS` (Task 12), `executeCommand` (Task 12), `getSuggestion` (Task 13),
  `copyToClipboard` (Task 14).
- Produces: `Terminal(): JSX.Element` — a default-focused, self-contained terminal UI with no
  external props, persisting submitted-command history to `localStorage` under key
  `devkit:history` (capped at 50 entries).

- [ ] **Step 1: Write the failing test**

```tsx
// apps/devkit/src/Terminal.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Terminal } from './Terminal';

describe('Terminal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the terminal chrome and welcome banner', () => {
    render(<Terminal />);
    expect(screen.getByText('datisa.dev - Universal DevKit')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to DevKit/)).toBeInTheDocument();
  });

  it('echoes and runs a submitted command', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    expect(screen.getByText(/datisa@devkit:~\$ guidv4/)).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('prints an error for an unknown command', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'nope{Enter}');
    expect(screen.getByText(/Command not found: nope/)).toBeInTheDocument();
  });

  it('clears the output on `clear`', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    await user.type(input, 'clear{Enter}');
    expect(screen.queryByText(/guidv4/)).not.toBeInTheDocument();
  });

  it('accepts a Tab suggestion for a unique command prefix', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    // 'guidv' is ambiguous (guidv4/guidv7 both match) — 'has' uniquely matches only 'hash'.
    await user.type(input, 'has');
    await user.keyboard('{Tab}');
    expect(input).toHaveValue('hash');
  });

  it('cycles submitted history with ArrowUp/ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    await user.type(input, 'guidv7{Enter}');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('guidv7');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('guidv4');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('guidv7');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('');
  });

  it('copies to clipboard and reports success for a `cp` command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const user = userEvent.setup();
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'cp case camel "hello world"{Enter}');
    expect(await screen.findByText('✓ Copied to clipboard!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('helloWorld');
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/devkit && npx vitest run src/Terminal.test.tsx`
Expected: FAIL — `Terminal.tsx` doesn't exist.

- [ ] **Step 3: Write the component**

```tsx
// apps/devkit/src/Terminal.tsx
import { useEffect, useRef, useState } from 'react';
import { COMMANDS } from './commands';
import { executeCommand } from './commands/execute-command';
import { getSuggestion } from './commands/get-suggestion';
import type { CommandResult } from './commands/types';
import { copyToClipboard } from './shared/clipboard';

const HISTORY_KEY = 'devkit:history';
const HISTORY_LIMIT = 50;
const PROMPT = 'datisa@devkit:~$';

type OutputLine = CommandResult | { text: string; kind: 'echo' | 'warning' };

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function Terminal() {
  const [output, setOutput] = useState<OutputLine[]>([
    { text: 'Welcome to DevKit v1.0.0', kind: 'system' },
    { text: "Type help to see a list of available commands.", kind: 'system' },
  ]);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [output]);

  function appendOutput(line: OutputLine) {
    setOutput((prev) => [...prev, line]);
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function navigateHistory(direction: 1 | -1) {
    if (history.length === 0) return;
    const nextIndex =
      direction === -1
        ? (historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1))
        : historyIndex === null
          ? null
          : historyIndex + 1;

    if (nextIndex === null || nextIndex >= history.length) {
      setHistoryIndex(null);
      setValue('');
      return;
    }
    setHistoryIndex(nextIndex);
    setValue(history[nextIndex]);
  }

  async function submit(raw: string) {
    const trimmed = raw.trim();
    appendOutput({ text: `${PROMPT} ${raw}`, kind: 'echo' });
    setValue('');
    setHistoryIndex(null);

    if (trimmed !== '') {
      const nextHistory =
        history[history.length - 1] === trimmed ? history : [...history, trimmed].slice(-HISTORY_LIMIT);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    }

    if (trimmed === '') return;

    if (trimmed === 'clear') {
      setOutput([]);
      return;
    }

    if (trimmed === 'help') {
      appendOutput({ text: 'Available commands:', kind: 'system' });
      for (const spec of COMMANDS) {
        const args = spec.args.map((arg) => (arg.optional ? `[${arg.name}]` : `<${arg.name}>`)).join(' ');
        appendOutput({ text: `  ${spec.id}${args ? ` ${args}` : ''} — ${spec.summary}`, kind: 'warning' });
      }
      appendOutput({ text: '  clear — Clear the terminal output', kind: 'warning' });
      return;
    }

    const { output: results, copyText } = await executeCommand(trimmed, COMMANDS);
    for (const line of results) appendOutput(line);

    if (copyText !== undefined) {
      const copied = await copyToClipboard(copyText);
      appendOutput(
        copied
          ? { text: '✓ Copied to clipboard!', kind: 'success' }
          : { text: 'Failed to copy to clipboard. Permission denied.', kind: 'error' },
      );
    }
  }

  const suggestion = getSuggestion(value, history, COMMANDS);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (suggestion) setValue(value + suggestion);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit(value);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigateHistory(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateHistory(1);
    }
  }

  return (
    <div className="devkit-terminal" onClick={focusInput}>
      <div className="devkit-terminal-header">
        <div className="devkit-window-controls">
          <div className="devkit-control close" />
          <div className="devkit-control minimize" />
          <div className="devkit-control maximize" />
        </div>
        <div className="devkit-terminal-title">datisa.dev - Universal DevKit</div>
      </div>
      <div className="devkit-output" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className={`output-line ${line.kind}`}>
            {line.text}
          </div>
        ))}
        <div className="input-line">
          <span className="prompt">{PROMPT}</span>
          <div className="command-input-wrapper">
            <div className="ghost-suggestion" aria-hidden="true">
              <span className="ghost-typed">{value}</span>
              <span className="ghost-rest">{suggestion ?? ''}</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="command-input"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/devkit && npx vitest run src/Terminal.test.tsx`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/Terminal.tsx apps/devkit/src/Terminal.test.tsx
git commit -m "Add Terminal component: the DevKit terminal REPL UI"
```

---

### Task 17: Wire `Terminal` into `register.tsx`

**Files:**
- Modify: `apps/devkit/src/register.tsx`

**Interfaces:**
- Consumes: `Terminal` from `./Terminal` (Task 16), `terminal.css` from `./styles/terminal.css`
  (Task 15).

- [ ] **Step 1: Update `register.tsx`**

In `apps/devkit/src/register.tsx`, replace the `tool-panel.css` import and `App` import/usage:

```diff
- import toolPanel from './styles/tool-panel.css';
- import { App } from './App';
+ import terminal from './styles/terminal.css';
+ import { Terminal } from './Terminal';
```

```diff
-    style.textContent = `${theme}\n${toolPanel}`;
+    style.textContent = `${theme}\n${terminal}`;
```

```diff
-    this.root.render(<App />);
+    this.root.render(<Terminal />);
```

- [ ] **Step 2: Run the existing register test to verify it still passes**

`register.test.tsx` already asserts `el.shadowRoot?.textContent` contains
`'datisa.dev - Universal DevKit'`, which `Terminal` still renders in its header — no test changes
needed.

Run: `cd apps/devkit && npx vitest run src/register.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 3: Commit**

```bash
git add apps/devkit/src/register.tsx
git commit -m "Mount Terminal instead of App in the DevKit custom element"
```

---

### Task 18: Remove the old sidebar/detail-panel UI

**Files:**
- Delete: `apps/devkit/src/App.tsx`
- Delete: `apps/devkit/src/App.test.tsx`
- Delete: `apps/devkit/src/tool-registry.ts`
- Delete: `apps/devkit/src/tools/guid-v4/GuidV4.tsx`, `GuidV4.test.tsx`
- Delete: `apps/devkit/src/tools/guid-v7/GuidV7.tsx`, `GuidV7.test.tsx`
- Delete: `apps/devkit/src/tools/date-time-converter/DateTimeConverter.tsx`, `DateTimeConverter.test.tsx`
- Delete: `apps/devkit/src/tools/epoch-converter/EpochConverter.tsx`, `EpochConverter.test.tsx`
- Delete: `apps/devkit/src/tools/json-formatter/JsonFormatter.tsx`, `JsonFormatter.test.tsx`
- Delete: `apps/devkit/src/tools/base64-tool/Base64Tool.tsx`, `Base64Tool.test.tsx`
- Delete: `apps/devkit/src/tools/jwt-decoder/JwtDecoder.tsx`, `JwtDecoder.test.tsx`
- Delete: `apps/devkit/src/tools/hash-generator/HashGenerator.tsx`, `HashGenerator.test.tsx`
- Delete: `apps/devkit/src/tools/url-codec/UrlCodec.tsx`, `UrlCodec.test.tsx`
- Delete: `apps/devkit/src/tools/case-converter/CaseConverter.tsx`, `CaseConverter.test.tsx`
- Delete: `apps/devkit/src/tools/regex-tester/RegexTester.tsx`, `RegexTester.test.tsx`
- Delete: `apps/devkit/src/shared/result.ts` (now unreferenced — its only remaining caller was these `*.tsx` files)
- Keep: every `*.util.ts`, `*.util.test.ts`, `md5.ts`, `md5.test.ts` in `apps/devkit/src/tools/*`

**Interfaces:** None — pure deletion, no new/changed exports.

- [ ] **Step 1: Confirm nothing outside these files references them**

```bash
cd apps/devkit && grep -rl "from './App'" src --include=*.ts --include=*.tsx
cd apps/devkit && grep -rl "tool-registry" src --include=*.ts --include=*.tsx
cd apps/devkit && grep -rl "shared/CopyButton\|shared/result" src --include=*.ts --include=*.tsx
```

Expected: no matches (Task 17 already removed `App`'s only import site; `CopyButton`/`result.ts`
have no importers left once these `*.tsx` files are gone).

- [ ] **Step 2: Delete the files**

```bash
git rm apps/devkit/src/App.tsx apps/devkit/src/App.test.tsx apps/devkit/src/tool-registry.ts
git rm apps/devkit/src/tools/guid-v4/GuidV4.tsx apps/devkit/src/tools/guid-v4/GuidV4.test.tsx
git rm apps/devkit/src/tools/guid-v7/GuidV7.tsx apps/devkit/src/tools/guid-v7/GuidV7.test.tsx
git rm apps/devkit/src/tools/date-time-converter/DateTimeConverter.tsx apps/devkit/src/tools/date-time-converter/DateTimeConverter.test.tsx
git rm apps/devkit/src/tools/epoch-converter/EpochConverter.tsx apps/devkit/src/tools/epoch-converter/EpochConverter.test.tsx
git rm apps/devkit/src/tools/json-formatter/JsonFormatter.tsx apps/devkit/src/tools/json-formatter/JsonFormatter.test.tsx
git rm apps/devkit/src/tools/base64-tool/Base64Tool.tsx apps/devkit/src/tools/base64-tool/Base64Tool.test.tsx
git rm apps/devkit/src/tools/jwt-decoder/JwtDecoder.tsx apps/devkit/src/tools/jwt-decoder/JwtDecoder.test.tsx
git rm apps/devkit/src/tools/hash-generator/HashGenerator.tsx apps/devkit/src/tools/hash-generator/HashGenerator.test.tsx
git rm apps/devkit/src/tools/url-codec/UrlCodec.tsx apps/devkit/src/tools/url-codec/UrlCodec.test.tsx
git rm apps/devkit/src/tools/case-converter/CaseConverter.tsx apps/devkit/src/tools/case-converter/CaseConverter.test.tsx
git rm apps/devkit/src/tools/regex-tester/RegexTester.tsx apps/devkit/src/tools/regex-tester/RegexTester.test.tsx
git rm apps/devkit/src/shared/result.ts
```

- [ ] **Step 3: Run the full test suite**

Run: `cd apps/devkit && npx vitest run`
Expected: PASS — every remaining test (tokenizer, all 11 commands, executor, suggestion engine,
clipboard, Terminal, register) passes; no leftover import errors from the deleted files.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove DevKit's old sidebar/detail-panel UI (superseded by Terminal)"
```

---

### Task 19: Also delete the pasted mockup reference file and verify build

**Files:**
- Delete: `apps/devkit/gemini-code-1785050498048.html` (reference mockup, not part of the app —
  same treatment `gemini-code-1784999663975.html` got after the first DevKit rebuild)

**Interfaces:** None.

- [ ] **Step 1: Delete the mockup file**

```bash
git rm apps/devkit/gemini-code-1785050498048.html
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/devkit && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `cd apps/devkit && npm run build`
Expected: build succeeds, `dist/devkit/remoteEntry.json` and bundle output are produced same as
before (verifies `Terminal`/`commands`/`shared/clipboard` all bundle cleanly under esbuild +
Native Federation, and nothing still references a deleted file).

- [ ] **Step 4: Run the full test suite one more time**

Run: `cd apps/devkit && npx vitest run`
Expected: PASS, same count as Task 18 Step 3 (the mockup file isn't part of any test).

- [ ] **Step 5: Commit**

```bash
git commit -m "Remove superseded DevKit mockup reference file"
```

---

## Manual verification (after all tasks)

- [ ] `cd apps/devkit && npm run serve`, open the dev URL, confirm: the terminal renders with the
  traffic-light header; typing `help` lists all 11 commands; `guidv4`, `hash md5 hello`,
  `cp case camel "hello world"` (with a clipboard paste to confirm), `jwt <a real token>`, and
  `clear` all behave as designed; typing a unique command prefix (e.g. `guidv`) shows dim ghost
  text and Tab completes it; typing `hash sh` after a fresh page load (empty history) shows `a1`
  ghost text from the `sha1` enum choice; ArrowUp/ArrowDown cycle previously submitted commands;
  reloading the page preserves history (not output).
