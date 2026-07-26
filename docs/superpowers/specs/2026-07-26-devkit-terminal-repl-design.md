# DevKit → Literal Terminal REPL Design

## Context

`apps/devkit` (see [[2026-07-26-devkit-react-mfe-monorepo-design]]) currently ports the 11
existing tools into a sidebar + detail-panel React UI, using a terminal *theme* (colors, font,
window chrome) but explicitly not a literal command-line. The user has since pasted a new mockup
(`apps/devkit/gemini-code-1785050498048.html`) that *is* a literal REPL — a single terminal window
where you type commands like `cp guidv4` and `help`, output scrolls above an input line — and
wants DevKit rebuilt to match it, plus real Tab-completion and inline auto-suggestion (neither of
which the mockup implements — it has no autocomplete at all).

This design **replaces** the sidebar/detail-panel UI in `apps/devkit` entirely. It does not touch
`apps/coming-soon` or the `../portfolio` shell wiring — those stay as designed previously (the
`dk-devkit-app` custom element boundary, `RemoteWebComponentHost`, routes, deploy pipeline are
unaffected; the web component now mounts a terminal instead of a sidebar).

## 1. What gets removed vs. kept

Removed (presentational UI, no longer used once the REPL is the whole app):
- `App.tsx` and its test — replaced by `Terminal.tsx`.
- Every `tools/*/ToolName.tsx` component and its `.test.tsx` — replaced by `commands/*.ts`.
- `shared/CopyButton.tsx` (and any other sidebar/panel-only shared UI) — the REPL's `cp` prefix
  replaces the copy button.

Kept unchanged:
- Every `tools/*/*.util.ts` and `*.util.test.ts` — these are pure functions, already
  framework-agnostic, and become the implementation behind each command's `run()`.
- `register.tsx` / the `dk-devkit-app` custom element boundary — same contract, now rendering
  `<Terminal />` instead of `<App />`.
- `bootstrap.tsx`, `main.ts`, federation config, build scripts — unaffected.

## 2. Command registry

New `apps/devkit/src/commands/` directory, one module per tool, each exporting a `CommandSpec`:

```ts
// commands/types.ts
export interface ArgSpec {
  name: string;
  kind: 'string' | 'enum';
  choices?: string[];   // required when kind === 'enum'
  optional?: boolean;   // trailing args only
}

export interface CommandResult {
  text: string;
  kind: 'success' | 'error' | 'system';
}

export interface CommandSpec {
  id: string;            // the literal command word, e.g. 'hash'
  summary: string;       // one-line description shown by `help`
  args: ArgSpec[];
  run(args: string[]): CommandResult | Promise<CommandResult>;
}
```

`commands/index.ts` exports `COMMANDS: CommandSpec[]`, built the same way `tool-registry.ts` is
today (import each module, list them). `help` and `clear` are handled directly in `Terminal.tsx`
as built-ins (not part of `COMMANDS`) since they act on the terminal itself, not a tool; `help`'s
output is generated from `COMMANDS` (id + summary + arg names), so it never goes stale.

### Command table (id → args → underlying util)

| id | args | underlying util |
|---|---|---|
| `guidv4` | *(none)* | `crypto.randomUUID()` (inline, same as today's `GuidV4`) |
| `guidv7` | *(none)* | `generateUuidV7()` |
| `hash` | `algorithm: enum[md5,sha1,sha256]`, `text: string` | `md5(text)` / `sha('SHA-1'\|'SHA-256', text)` |
| `base64` | `mode: enum[encode,decode]`, `text: string` | `encodeBase64`/`decodeBase64` |
| `url` | `mode: enum[encode,decode]`, `text: string` | `encodeUrl`/`decodeUrl` |
| `case` | `mode: enum[camel,pascal,snake,kebab]`, `text: string` | `toCamelCase`/`toPascalCase`/`toSnakeCase`/`toKebabCase` |
| `jwt` | `token: string` | `decodeJwt(token)` → pretty-printed header+payload JSON |
| `json` | `mode: enum[pretty,minify]`, `text: string` | `formatJson(text, mode)` |
| `regex` | `pattern: string`, `flags: string`, `text: string`, `replacement: string (optional)` | `testRegex(...)` |
| `date` | `input: string (optional)`, `timeZone: string (optional, default 'UTC')` | `convertDateTime(input, timeZone)` |
| `epoch` | `mode: enum[to-date,to-epoch]`, `input: string (optional)` | `epochToDate`/`dateToEpoch` |

All args are plain strings from the tokenizer; `run()` does its own validation and returns
`kind: 'error'` with the underlying util's thrown message on bad input (same error messages users
already see today).

## 3. Parsing

`parseCommandLine(input: string): string[]` — a small shell-like tokenizer: splits on whitespace,
honors `'...'` and `"..."` quoted spans (so `hash sha256 "hello world"` → `['hash','sha256','hello world']`),
and strips a leading `cp` token before the rest is parsed as a normal command (see §5).

## 4. Autocomplete / ghost-text suggestion

`getSuggestion(input: string, history: string[]): string | null`, in priority order:

1. **History match** — the most recent entry in `history` that starts with `input` (case-sensitive,
   exact prefix) and is longer than `input` → suggest the remainder.
2. **Command-name match** — if `input`'s first token is a non-empty prefix of exactly one
   `CommandSpec.id` (or `help`/`clear`) and no space has been typed yet → suggest the remainder of
   that id.
3. **Enum-arg match** — if the first token is a fully-typed, valid command id, and the token
   currently being typed occupies an `ArgSpec` position with `kind: 'enum'` → suggest the
   remainder of the first choice whose value starts with what's typed.
4. Otherwise → `null` (no ghost text).

Rendered in `Terminal.tsx` as a dim (`color: #64748b`) `<span>` overlaid in the same font/position
as the real input, showing `input + suggestion` with only the suggestion portion dimmed — the
standard ghost-text overlay trick (a transparent-text `<input>` on top of a `<div>` that renders
the full ghost string, both absolutely positioned in the same box). **Tab**: if a suggestion is
showing, replace the input value with `input + suggestion` and move the caret to the end;
preventDefault so focus doesn't leave the input. **Tab with no suggestion**: no-op. This is
independent of **ArrowUp/ArrowDown**, which cycle through `history` verbatim (readline-style),
replacing the whole input value.

## 5. Execution flow

On Enter:
1. Echo the input line (`datisa@devkit:~$ <input>`) to the output log.
2. Push the raw input to `history` (deduped against the immediately-preceding entry) and persist
   to `localStorage` under `devkit:history`, capped at 50 entries.
3. Empty input → no-op (just echoes and re-prompts).
4. `help` / `clear` → built-in behavior (list commands / wipe output log).
5. Otherwise tokenize; if the first token is `cp`, remember `copyToClipboard = true` and drop it;
   look up the (possibly now-first) token against `COMMANDS`.
   - Unknown command → print `Command not found: <cmd>. Type 'help' for available commands.` (error).
   - Known command → validate arg count against required `ArgSpec`s, call `run(args)`.
     - Success → print result (`kind: 'success'`); if `copyToClipboard`, also copy `text` to the
       clipboard (reusing today's clipboard-with-fallback helper) and print a `✓ Copied to
       clipboard!` system line.
     - Error → print the message (`kind: 'error'`), no clipboard action.

## 6. `Terminal.tsx`

Single component replacing `App.tsx`: renders the mockup's terminal chrome (header with
traffic-light dots + centered title `datisa.dev - Universal DevKit`) around a scrollable output
log (`{text, kind}[]` in state, each rendered with the mockup's `.success/.error/.system/.warning`
color classes) and the input line (prompt + input-with-ghost-overlay). Clicking anywhere in the
body focuses the input, matching the mockup. On mount, prints the same welcome/help banner as the
mockup.

## 7. Testing

- `commands/*.test.ts` — one test file per command's `run()`, covering the success case and each
  documented error case (ports the assertions from the deleted `*.test.tsx` files, adjusted to
  call `run()` directly instead of rendering a component).
- `parseCommandLine.test.ts` — quoting, empty input, `cp` stripping.
- `getSuggestion.test.ts` — all four priority branches, including the "no match" case.
- `Terminal.test.tsx` — Enter submits and echoes, Tab accepts a visible suggestion and is a no-op
  otherwise, ArrowUp/ArrowDown cycle history, `cp <cmd>` copies to clipboard (mocked
  `navigator.clipboard`), unknown command prints the error line.

## Out of scope

- No changes to `apps/coming-soon` or `../portfolio`.
- No multi-line/paste-mode input (per user: quoted single-line args only).
- No persistence of output log across reloads — only `history` (submitted command strings)
  persists.
- No new dependencies — same React/esbuild/Native Federation stack as the existing `apps/devkit`.
