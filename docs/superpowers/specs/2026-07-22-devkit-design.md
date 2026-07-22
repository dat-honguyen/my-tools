# DevKit: renaming hello-world into a real dev-tools MFE

## Context

`hello-world` was the first Native Federation remote proving the shell's MFE wiring
works. This replaces it with `devkit` — a real, useful multi-tool remote — rather
than adding it alongside hello-world. This is a two-repo change: `my-tools` (this
repo, holds the remote) and `dat-honguyen.github.io` (the shell that consumes it).

## Scope

- Full rename: `hello-world` disappears; `devkit` takes its slot everywhere (project
  name, federation remote name, GitHub Pages subpath, shell route, shell environment
  config, shell project card).
- 11 tools in the first version, listed below.
- No Angular Router inside DevKit — a signal-driven tool switcher, matching this
  workspace's `--routing=false` convention for remotes.

## 1. Rename (my-tools repo)

- `projects/hello-world` → `projects/devkit` (directory + all internal paths).
- `angular.json`: project key `hello-world` → `devkit`, `root`/`sourceRoot` paths
  updated, `prefix` becomes `dk` (component selectors like `dk-root`).
- `projects/devkit/federation.config.mjs`: `name: 'devkit'`, `exposes['./Component']`
  points at the new app root.
- `.github/workflows/deploy.yml`: `PROJECTS` env var `hello-world` → `devkit`.
- `README.md`: update the project list and any hello-world references.

## 2. Shell wiring (dat-honguyen.github.io repo)

- `src/environments/environment.ts`: remote key + URL become
  `devkit: 'https://dat-honguyen.github.io/my-tools/devkit/remoteEntry.json'`.
- `src/environments/environment.development.ts`: `devkit: 'http://localhost:4201/remoteEntry.json'`.
- `src/app/app.routes.ts`: route path `tools/devkit` (was `tools/hello-world`),
  `loadRemoteModule({ remoteName: 'devkit', exposedModule: './Component' })`.
- `src/app/components/sections/projects-section/projects-section.component.ts`:
  update the "My Tools" project's `tagline`/`description` to describe DevKit
  (a small suite of dev utilities) instead of "bare Hello World remote", update
  `primaryCta.routerLink` to `/tools/devkit`. **Status stays `IN_PROGRESS_STATUS`**
  even after DevKit ships (explicit user call — not tied to whether the remote
  actually works).

## 3. Internal architecture (no router)

Root `App` component (`dk-root`) holds a `selectedToolId = signal<string>('guid-v4')`.
A `TOOLS` registry (id, label, component reference) feeds:
- The sidebar list (click sets `selectedToolId`).
- A `@switch (selectedToolId())` in the template that renders the matching tool's
  standalone component in the detail panel.

This keeps routing entirely out of the remote, consistent with how `hello-world`
was scaffolded (`--routing=false`) and avoids nested-router complexity when the
shell later needs to deep-link into a specific tool (still possible via a shell
route param passed as an `@Input`/signal if ever needed — not built now, YAGNI).

## 4. Layout

Two-pane layout inside the shell's existing `.tool-frame` wrapper:
- **Sidebar**: tool list with a text filter input (11 entries, will grow).
- **Detail panel**: selected tool's component.

Responsive fallback: below some width, sidebar collapses to a top dropdown/select
instead of a persistent list (exact breakpoint is an implementation detail, not a
design constraint).

## 5. Shared components

- **`CopyButtonComponent`**: standalone, `[text]: string` input. On click, writes to
  clipboard via `navigator.clipboard.writeText(text)`, shows "Copied" for ~1.5s then
  reverts. No toast library — just local component state.
- **`ToolPanelComponent`** (or a directive-free convention via a shared CSS class):
  consistent chrome per tool — title, one-line description, content area. Exact
  shape (component vs. shared template partial) is an implementation detail.

## 6. The 11 tools

| Tool | Behavior |
|---|---|
| GUID v4 | `crypto.randomUUID()`. Copy button. Regenerate button. |
| GUID v7 | Hand-rolled RFC 9562 UUIDv7 (48-bit ms timestamp + random bits) — no dependency. Copy + regenerate. |
| Date/Time Converter | Single input, defaults to "now"; accepts a pasted date string or epoch. Renders simultaneously: ISO 8601, the same instant in a chosen IANA timezone (`Intl.DateTimeFormat`), and its UTC offset (±HH:mm). Each output has its own copy button. |
| Epoch/Unix Converter | Epoch (seconds or ms, auto-detected by magnitude) ↔ human-readable date. Separate from the Date/Time Converter — focused specifically on unix timestamps. |
| JSON Formatter/Validator | Pretty-print (2-space) and minify actions; invalid JSON shows an inline parse error instead of output. |
| Base64 Encode/Decode | Text ↔ Base64, both directions, one input/output pair with a direction toggle. |
| JWT Decoder | Paste a JWT; decode header + payload (base64url) as formatted JSON. Explicitly no signature verification — labeled as such in the UI. |
| Hash Generator | Text → SHA-1 / SHA-256 via native `crypto.subtle.digest`; MD5 via a small vendored pure-JS implementation (Web Crypto has no MD5 support). All three shown together, each copyable. |
| URL Encode/Decode | Text ↔ percent-encoding (`encodeURIComponent`/`decodeURIComponent`), both directions. |
| Case Converter | Text → camelCase / snake_case / kebab-case / PascalCase, all four shown at once, each copyable. |
| Regex Tester | Regex + flags input, test string input, live-highlighted matches, optional replacement string with live preview. |

## 7. Styling — blends into the shell, stands alone outside it

Native Federation renders DevKit's component tree directly inside the shell's own
document (component-level embedding, not an iframe — no Shadow DOM isolation). CSS
custom properties are inherited by descendant elements regardless of Angular's
per-component style encapsulation, so if DevKit's CSS references the *same custom
property names* the shell already defines on `:root`
(`src/styles/abstracts/_design-tokens.scss` in the shell repo),
it automatically picks up the shell's real values when embedded.

DevKit's own stylesheets use `var(--token, <fallback>)` everywhere, with fallbacks
equal to the shell's actual hex values, so standalone access (DevKit's own
`index.html`, no shell `:root` variables present) renders identically to the
embedded look:

```css
:root {
    --color-bg: #07111f;
    --color-surface: #0f172a;
    --color-primary: #3b82f6;
    --color-accent: #60a5fa;
    --color-text: #f8fafc;
    --color-text-muted: #b7c6df;
    --color-border: rgba(147, 197, 253, 0.22);
}
```

(DevKit re-declares these as its *own* `:root` fallback block — it does not import
the shell's SCSS file. If the shell's tokens ever change, this fallback block needs
a manual update to stay visually in sync for the standalone-access case; embedded
access always reflects the shell's live values automatically.)

Overall feel: dark navy background, monospace type for tool inputs/outputs, blue
accent — a "code editor" aesthetic consistent with the shell's night-sky theme.

## Testing

- Unit tests (Vitest, matching existing convention) for the non-trivial pure logic:
  UUIDv7 generation (format/version bits), the date/time conversions, JSON
  formatting/validation, JWT decoding, hash outputs against known test vectors,
  case conversion, regex match/replace.
- `CopyButtonComponent` and per-tool components get a basic render/interaction spec
  each, consistent with existing `*.spec.ts` conventions in both repos.
- No E2E/browser test framework introduced — out of scope for this change.
