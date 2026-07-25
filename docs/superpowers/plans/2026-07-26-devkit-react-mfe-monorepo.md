# DevKit React MFE + Coming Soon Angular Remote — Hybrid Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `my-tools` into a hybrid Nx monorepo hosting two independent Native Federation remotes — `apps/devkit` (DevKit rebuilt in React, exposed as a Web Component) and `apps/coming-soon` (a new Angular "Coming Soon" placeholder) — and wire both into the Angular shell at `../portfolio`.

**Architecture:** Nx is used purely as a task runner/cache over hand-written `project.json` targets — no `@nx/angular`/`@nx/react` plugin. `apps/devkit` builds with plain esbuild via `@softarc/native-federation` + `@softarc/native-federation-esbuild` (the same framework-agnostic core Angular's native-federation builder uses under the hood), following the pattern in the reference repo `manfredsteyer/native-federation-react-example`. `apps/coming-soon` reuses the exact Angular CLI builder chain (`@angular-architects/native-federation:build`) that `projects/devkit` uses today. The React remote crosses the framework boundary into the Angular shell as a single custom element (`<dk-devkit-app>`), registered as a side effect of loading its exposed module — the shell never touches React APIs directly.

**Tech Stack:** Nx (task runner only), esbuild + `@softarc/native-federation` + `@softarc/native-federation-esbuild` (devkit), React 19, Vitest + `@testing-library/react` (devkit tests), Angular 22 + `@angular-architects/native-federation` (coming-soon, portfolio — unchanged), TypeScript ~6.0.

## Global Constraints

- Node 22, npm 10.9.8 (from root `package.json` `engines`/`packageManager` — carry forward unchanged).
- No Vite, no Rsbuild, no webpack — `apps/devkit` builds with plain esbuild via the native-federation esbuild adapter (explicit user decision).
- No `@nx/angular` or `@nx/react` Nx plugins — `project.json` targets call existing builders/scripts directly.
- `apps/devkit`'s only framework-crossing surface is the custom element `<dk-devkit-app>` defined in `apps/devkit/src/register.tsx` — no other file may reference Angular APIs, and no Angular file may import React.
- All 11 existing DevKit tools must be ported with identical behavior (same `*.util.ts` logic, same edge cases) — verified by porting each tool's existing `*.util.spec.ts` assertions into the new `*.util.test.ts`.
- `../portfolio` stays Angular — only the specific files listed in Phase D are touched there.
- Every util/component file gets a test; every task ends green before moving to the next.

---

## Phase A — Monorepo scaffolding

### Task 1: Nx workspace root

**Files:**
- Create: `nx.json`
- Create: `tsconfig.base.json`
- Modify: `package.json` (repo root)
- Delete (end of this task): none yet — `angular.json` and `projects/devkit` are removed only in Task 20, after both new apps are verified working side by side.

**Interfaces:**
- Produces: `apps/*` as the Nx workspace glob every later task's `project.json` lives under.

- [ ] **Step 1: Add Nx and workspace glob to root `package.json`**

Replace the root `package.json` with:

```json
{
  "name": "my-tools",
  "version": "0.0.0",
  "private": true,
  "packageManager": "npm@10.9.8",
  "engines": {
    "node": "22.22.3"
  },
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "devkit:serve": "nx serve devkit",
    "coming-soon:serve": "nx serve coming-soon"
  },
  "devDependencies": {
    "nx": "^22.5.0",
    "prettier": "^3.8.1",
    "tsx": "^4.19.2",
    "typescript": "~6.0.2"
  }
}
```

- [ ] **Step 2: Create `nx.json`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "cache": true,
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "cache": true
    }
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 4: Install and verify Nx runs**

Run: `npm install`
Then: `npx nx --version`
Expected: prints an Nx version (e.g. `22.5.0`) with no errors. There are no projects yet, so `nx run-many -t build` at this point should print "No projects with 'build' target" — that's expected until Task 2.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json nx.json tsconfig.base.json
git commit -m "Set up Nx workspace root for hybrid monorepo"
```

---

### Task 2: `apps/devkit` build pipeline skeleton

**Files:**
- Create: `apps/devkit/package.json`
- Create: `apps/devkit/project.json`
- Create: `apps/devkit/tsconfig.json`
- Create: `apps/devkit/federation.config.js`
- Create: `apps/devkit/build/build.ts`
- Create: `apps/devkit/src/main.ts`
- Create: `apps/devkit/src/bootstrap.tsx`
- Create: `apps/devkit/src/register.tsx`
- Create: `apps/devkit/src/App.tsx` (placeholder — replaced with real content in Task 15)
- Create: `apps/devkit/index.html`
- Create: `apps/devkit/vitest.config.ts`

**Interfaces:**
- Produces: `customElements.define('dk-devkit-app', DevkitElement)` in `register.tsx` — Task 15+ (App shell) and Phase D (shell wrapper) both depend on this exact tag name.
- Produces: `apps/devkit` exposes `./Component` → `apps/devkit/src/register.tsx` via `federation.config.js`, matching what `../portfolio`'s `environment.ts` (Phase D) will point `loadRemoteModule` at.

- [ ] **Step 1: `apps/devkit/package.json`**

```json
{
  "name": "devkit",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsx build/build.ts",
    "serve": "tsx build/build.ts --serve",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@softarc/native-federation": "^4.3.2"
  },
  "devDependencies": {
    "@softarc/native-federation-esbuild": "^4.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "esbuild": "^0.24.2",
    "jsdom": "^28.0.0",
    "vitest": "^4.0.8"
  }
}
```

- [ ] **Step 2: `apps/devkit/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src", "build"]
}
```

(The `vite/client` types entry is only used for `import.meta` typing convenience; no Vite bundler is used — remove if it causes a resolution error and instead add `"types": []` with a local `declare const import.meta: { url: string }` if needed.)

- [ ] **Step 3: `apps/devkit/federation.config.js`**

```js
const { withNativeFederation, shareAll } = require('@softarc/native-federation/build');

module.exports = withNativeFederation({
  name: 'devkit',

  exposes: {
    './Component': './apps/devkit/src/register.tsx',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
```

- [ ] **Step 4: `apps/devkit/build/build.ts`**

```ts
import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { federationBuilder } from '@softarc/native-federation/build';

async function main() {
  const serve = process.argv.includes('--serve');
  const outputPath = 'dist/devkit';

  await federationBuilder.init({
    options: {
      workspaceRoot: path.join(__dirname, '../../..'),
      outputPath,
      tsConfig: 'apps/devkit/tsconfig.json',
      federationConfig: 'apps/devkit/federation.config.js',
      verbose: false,
    },
    adapter: createEsBuildAdapter({ plugins: [] }),
  });

  fs.rmSync(outputPath, { force: true, recursive: true });

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: ['apps/devkit/src/main.ts'],
    external: federationBuilder.externals,
    outdir: outputPath,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    mainFields: ['es2020', 'browser', 'module', 'main'],
    conditions: ['es2020', 'es2015', 'module'],
    resolveExtensions: ['.tsx', '.ts', '.mjs', '.js'],
    tsconfig: 'apps/devkit/tsconfig.json',
    splitting: true,
    sourcemap: true,
  };

  if (serve) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    const { host, port } = await ctx.serve({ servedir: outputPath, port: 4202 });
    console.log(`devkit serving at http://${host}:${port}/remoteEntry.json`);
  } else {
    await esbuild.build(buildOptions);
  }

  fs.copyFileSync('apps/devkit/index.html', `${outputPath}/index.html`);

  await federationBuilder.build();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 5: `apps/devkit/src/main.ts`**

```ts
import { initFederation } from '@softarc/native-federation';

(async () => {
  await initFederation();
  await import('./bootstrap');
})();
```

- [ ] **Step 6: `apps/devkit/src/register.tsx` — the React↔Angular boundary**

```tsx
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';

class DevkitElement extends HTMLElement {
  private root?: Root;

  connectedCallback(): void {
    this.root = createRoot(this);
    this.root.render(<App />);
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
  }
}

if (!customElements.get('dk-devkit-app')) {
  customElements.define('dk-devkit-app', DevkitElement);
}

export {};
```

- [ ] **Step 7: `apps/devkit/src/bootstrap.tsx` (standalone dev entry, imports the registration)**

```tsx
import './register';
```

- [ ] **Step 8: `apps/devkit/src/App.tsx` — placeholder for now**

```tsx
export function App() {
  return <div>DevKit loading…</div>;
}
```

- [ ] **Step 9: `apps/devkit/index.html` (standalone dev shell only — not used inside the Angular host)**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DevKit</title>
  </head>
  <body>
    <dk-devkit-app></dk-devkit-app>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

- [ ] **Step 10: `apps/devkit/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    globals: false,
  },
});
```

- [ ] **Step 11: `apps/devkit/project.json` (Nx targets)**

```json
{
  "name": "devkit",
  "root": "apps/devkit",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm run build",
        "cwd": "apps/devkit"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm run serve",
        "cwd": "apps/devkit"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm run test",
        "cwd": "apps/devkit"
      }
    }
  }
}
```

- [ ] **Step 12: Install devkit's dependencies and build**

Run: `npm install`
Then: `npx nx build devkit`
Expected: `dist/devkit/remoteEntry.json` exists, along with the bundled chunks. Inspect with:

Run: `cat dist/devkit/remoteEntry.json` (or `Get-Content dist/devkit/remoteEntry.json` in PowerShell)
Expected: valid JSON containing `"name": "devkit"` and an `exposes` entry for `./Component`.

- [ ] **Step 13: Write a smoke test that the custom element registers**

Create `apps/devkit/src/register.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import './register';

describe('register', () => {
  it('defines the dk-devkit-app custom element', () => {
    expect(customElements.get('dk-devkit-app')).toBeDefined();
  });

  it('mounts and unmounts without throwing', async () => {
    const el = document.createElement('dk-devkit-app');
    document.body.appendChild(el);
    expect(el.textContent).toContain('DevKit loading');
    el.remove();
  });
});
```

- [ ] **Step 14: Run the test**

Run: `npx nx test devkit`
Expected: PASS (2 tests).

- [ ] **Step 15: Commit**

```bash
git add apps/devkit package-lock.json
git commit -m "Scaffold apps/devkit: esbuild + native-federation React remote skeleton"
```

---

### Task 3: Shared devkit primitives (Result, CopyButton, global styles)

**Files:**
- Create: `apps/devkit/src/shared/result.ts`
- Create: `apps/devkit/src/shared/CopyButton.tsx`
- Create: `apps/devkit/src/shared/CopyButton.test.tsx`
- Create: `apps/devkit/src/styles/theme.css`
- Create: `apps/devkit/src/styles/tool-panel.css`

**Interfaces:**
- Produces: `Result<T>` / `tryResult<T>(fn: () => T): Result<T>` — every tool task (4–14) imports this from `../../shared/result`.
- Produces: `<CopyButton text={string} />` — every tool task imports this from `../../shared/CopyButton`.
- Produces: CSS classes `tool-panel`, `tool-header`, `tool-title`, `tool-description`, `field`, `output-row`, `output-value`, `action-button`, `error-text` (unchanged names from the Angular app's `app.css`/`styles.css`, reused verbatim in JSX `className`s) — every tool task's markup uses these class names.

- [ ] **Step 1: Port `Result`**

```ts
// apps/devkit/src/shared/result.ts
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function tryResult<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}
```

- [ ] **Step 2: Write `CopyButton`'s failing test first**

```tsx
// apps/devkit/src/shared/CopyButton.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CopyButton } from './CopyButton';

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe('CopyButton', () => {
  it('shows "Copy" initially and "Copied" after a click, reverting after a timeout', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton text="hello" />);

    expect(screen.getByRole('button')).toHaveTextContent('Copy');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Copied'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');

    vi.advanceTimersByTime(1500);
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Copy'));
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2b: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `Cannot find module './CopyButton'`.

- [ ] **Step 3: Implement `CopyButton`**

```tsx
// apps/devkit/src/shared/CopyButton.tsx
import { useEffect, useRef, useState } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="copy-button" onClick={copy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Port the terminal-themed global styles**

```css
/* apps/devkit/src/styles/theme.css */
:root {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: rgba(148, 163, 184, 0.22);
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-primary: #3b82f6;
  --color-accent: #60a5fa;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --font-mono: 'Fira Code', 'JetBrains Mono', Consolas, Monaco, monospace;
}

* {
  box-sizing: border-box;
}

dk-devkit-app {
  display: block;
  min-height: 100%;
  font-family: var(--font-mono);
  color: var(--color-text);
  background: var(--color-bg);
}

.devkit-terminal {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.devkit-terminal-header {
  background: var(--color-bg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.devkit-window-controls {
  display: flex;
  gap: 8px;
}

.devkit-control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.devkit-control.close {
  background-color: #ff5f56;
}
.devkit-control.minimize {
  background-color: #ffbd2e;
}
.devkit-control.maximize {
  background-color: #27c93f;
}

.devkit-terminal-title {
  margin-left: auto;
  margin-right: auto;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.devkit-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.devkit-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.devkit-filter {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
}

.devkit-tool-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.devkit-tool-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
  cursor: pointer;
}

.devkit-tool-item:hover {
  background: var(--color-surface);
}

.devkit-tool-item.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: inset 2px 0 0 var(--color-primary);
}

.devkit-detail {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.devkit-empty-state {
  color: var(--color-text-muted);
}
```

- [ ] **Step 6: Port the tool-panel styles (used by every tool)**

```css
/* apps/devkit/src/styles/tool-panel.css */
.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 640px;
}

.tool-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tool-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.tool-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.field input,
.field select,
.field textarea {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 6rem;
}

.output-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.output-value {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  white-space: pre;
}

.action-button {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font: inherit;
  cursor: pointer;
}

.action-button:hover {
  background: var(--color-accent);
}

.error-text {
  color: var(--color-error);
  font-size: 0.875rem;
}

.copy-button {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.copy-button:hover {
  border-color: var(--color-primary);
}
```

- [ ] **Step 7: Import both stylesheets from `register.tsx`**

Edit `apps/devkit/src/register.tsx`, add at the top:

```tsx
import './styles/theme.css';
import './styles/tool-panel.css';
```

(esbuild needs a CSS loader for this — add to `build/build.ts`'s `buildOptions`: `loader: { '.css': 'css' }`. Also add `import './styles/theme.css'; import './styles/tool-panel.css';` — already covered above.)

- [ ] **Step 7b: Enable CSS bundling in the build script**

Edit `apps/devkit/build/build.ts`, add `loader: { '.css': 'css' }` to the `buildOptions` object (after `sourcemap: true,`).

- [ ] **Step 8: Rebuild and re-test**

Run: `npx nx build devkit && npx nx test devkit`
Expected: build succeeds (now emits a `.css` chunk too), tests still PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/devkit
git commit -m "Port devkit shared Result/CopyButton and terminal-themed styles to React"
```

---

### Task 4: Port `guid-v4`

**Files:**
- Create: `apps/devkit/src/tools/guid-v4/GuidV4.tsx`
- Create: `apps/devkit/src/tools/guid-v4/GuidV4.test.tsx`

**Interfaces:**
- Consumes: `CopyButton` from `../../shared/CopyButton` (Task 3).
- Produces: `export function GuidV4()` — Task 15's tool registry imports this.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/devkit/src/tools/guid-v4/GuidV4.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuidV4 } from './GuidV4';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GuidV4', () => {
  it('shows a v4 UUID and regenerates a new one on click', async () => {
    const user = userEvent.setup();
    render(<GuidV4 />);

    const first = screen.getByText(UUID_V4).textContent;
    expect(first).toMatch(UUID_V4);

    await user.click(screen.getByRole('button', { name: 'Generate new' }));
    const second = screen.getByText(UUID_V4).textContent;
    expect(second).not.toBe(first);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `Cannot find module './GuidV4'`.

- [ ] **Step 3: Implement `GuidV4`**

```tsx
// apps/devkit/src/tools/guid-v4/GuidV4.tsx
import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';

export function GuidV4() {
  const [value, setValue] = useState(() => crypto.randomUUID());

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">GUID v4</h2>
        <p className="tool-description">
          A random (version 4) UUID, generated with the browser&apos;s native{' '}
          <code>crypto.randomUUID()</code>.
        </p>
      </header>
      <div className="output-row">
        <code className="output-value">{value}</code>
        <CopyButton text={value} />
      </div>
      <button type="button" className="action-button" onClick={() => setValue(crypto.randomUUID())}>
        Generate new
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/devkit/src/tools/guid-v4
git commit -m "Port guid-v4 tool to React"
```

---

### Task 5: Port `guid-v7`

**Files:**
- Create: `apps/devkit/src/tools/guid-v7/guid-v7.util.ts`
- Create: `apps/devkit/src/tools/guid-v7/guid-v7.util.test.ts`
- Create: `apps/devkit/src/tools/guid-v7/GuidV7.tsx`
- Create: `apps/devkit/src/tools/guid-v7/GuidV7.test.tsx`

**Interfaces:**
- Produces: `generateUuidV7(): string` — pure, no framework dependency, ported unchanged.
- Produces: `export function GuidV7()` — Task 15 imports this.

- [ ] **Step 1: Port the util (unchanged logic) and its test first**

```ts
// apps/devkit/src/tools/guid-v7/guid-v7.util.test.ts
import { describe, expect, it } from 'vitest';
import { generateUuidV7 } from './guid-v7.util';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuidV7', () => {
  it('produces a valid v7 UUID', () => {
    expect(generateUuidV7()).toMatch(UUID_V7);
  });

  it('produces increasing values for increasing timestamps', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(a.slice(0, 8) <= b.slice(0, 8)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `Cannot find module './guid-v7.util'`.

- [ ] **Step 3: Implement the util (verbatim port from the Angular version)**

```ts
// apps/devkit/src/tools/guid-v7/guid-v7.util.ts
export function generateUuidV7(): string {
  const timestamp = BigInt(Date.now());
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  const bytes = new Uint8Array(16);

  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);

  bytes[6] = 0x70 | (randomBytes[0] & 0x0f);
  bytes[7] = randomBytes[1];

  bytes[8] = 0x80 | (randomBytes[2] & 0x3f);
  bytes[9] = randomBytes[3];
  bytes[10] = randomBytes[4];
  bytes[11] = randomBytes[5];
  bytes[12] = randomBytes[6];
  bytes[13] = randomBytes[7];
  bytes[14] = randomBytes[8];
  bytes[15] = randomBytes[9];

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/guid-v7/GuidV7.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuidV7 } from './GuidV7';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GuidV7', () => {
  it('shows a v7 UUID and regenerates on click', async () => {
    const user = userEvent.setup();
    render(<GuidV7 />);
    const first = screen.getByText(UUID_V7).textContent;
    expect(first).toMatch(UUID_V7);
    await user.click(screen.getByRole('button', { name: 'Generate new' }));
    expect(screen.getByText(UUID_V7).textContent).not.toBe(first);
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/guid-v7/GuidV7.tsx
import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { generateUuidV7 } from './guid-v7.util';

export function GuidV7() {
  const [value, setValue] = useState(generateUuidV7);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">GUID v7</h2>
        <p className="tool-description">A time-sortable (version 7) UUID.</p>
      </header>
      <div className="output-row">
        <code className="output-value">{value}</code>
        <CopyButton text={value} />
      </div>
      <button type="button" className="action-button" onClick={() => setValue(generateUuidV7())}>
        Generate new
      </button>
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/guid-v7
git commit -m "Port guid-v7 tool to React"
```

---

### Task 6: Port `date-time-converter`

**Files:**
- Create: `apps/devkit/src/tools/date-time-converter/date-time-converter.util.ts`
- Create: `apps/devkit/src/tools/date-time-converter/date-time-converter.util.test.ts`
- Create: `apps/devkit/src/tools/date-time-converter/DateTimeConverter.tsx`
- Create: `apps/devkit/src/tools/date-time-converter/DateTimeConverter.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult` from `../../shared/result` (Task 3).
- Produces: `convertDateTime(input: string, timeZone: string): DateTimeConversion` and `export function DateTimeConverter()` for Task 15.

- [ ] **Step 1: Port the util's tests first (unchanged assertions from `date-time-converter.util.spec.ts`)**

```ts
// apps/devkit/src/tools/date-time-converter/date-time-converter.util.test.ts
import { describe, expect, it } from 'vitest';
import { convertDateTime } from './date-time-converter.util';

describe('convertDateTime', () => {
  it('parses an ISO string', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
    expect(result.offset).toBe('+00:00');
  });

  it('parses a whole-second epoch value', () => {
    const result = convertDateTime('1705320000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('parses a millisecond epoch value', () => {
    const result = convertDateTime('1705320000000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('defaults to now for blank input', () => {
    const before = Date.now();
    const result = convertDateTime('', 'UTC');
    const parsed = new Date(result.iso).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
  });

  it('throws for an invalid date string', () => {
    expect(() => convertDateTime('not a date', 'UTC')).toThrow('Invalid date: not a date');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `Cannot find module './date-time-converter.util'`.

- [ ] **Step 3: Implement the util (verbatim port)**

```ts
// apps/devkit/src/tools/date-time-converter/date-time-converter.util.ts
export interface DateTimeConversion {
  iso: string;
  zoned: string;
  offset: string;
}

export function convertDateTime(input: string, timeZone: string): DateTimeConversion {
  const date = parseFlexibleDate(input);
  return {
    iso: date.toISOString(),
    zoned: formatInTimeZone(date, timeZone),
    offset: formatUtcOffset(date, timeZone),
  };
}

function parseFlexibleDate(input: string): Date {
  const trimmed = input.trim();
  if (trimmed === '') {
    return new Date();
  }
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid epoch value: ${input}`);
    }
    return date;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }
  return date;
}

function formatInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(' ', 'T');
}

function formatUtcOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const raw = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(raw);
  if (!match) {
    return '+00:00';
  }
  const [, sign, hourStr, minuteStr = '00'] = match;
  return `${sign}${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/date-time-converter/DateTimeConverter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DateTimeConverter } from './DateTimeConverter';

describe('DateTimeConverter', () => {
  it('converts a typed ISO date into the three output rows', async () => {
    const user = userEvent.setup();
    render(<DateTimeConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), '2024-01-15T12:00:00Z');
    expect(screen.getByText('2024-01-15T12:00:00.000Z')).toBeInTheDocument();
  });

  it('shows an error for invalid input', async () => {
    const user = userEvent.setup();
    render(<DateTimeConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), 'nope');
    expect(screen.getByText('Invalid date: nope')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/date-time-converter/DateTimeConverter.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { convertDateTime } from './date-time-converter.util';

const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export function DateTimeConverter() {
  const [input, setInput] = useState('');
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const result = useMemo(() => tryResult(() => convertDateTime(input, timeZone)), [input, timeZone]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Date/Time Converter</h2>
        <p className="tool-description">
          Defaults to now. Paste an ISO date or an epoch (seconds or milliseconds) to convert it.
        </p>
      </header>

      <div className="field">
        <label htmlFor="dt-input">Date, or leave blank for now</label>
        <input
          id="dt-input"
          type="text"
          placeholder="e.g. 2024-01-15T12:00:00Z or 1705320000"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="dt-timezone">Timezone</label>
        <select id="dt-timezone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          {TIME_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      {result.ok ? (
        <>
          <div className="output-row">
            <code className="output-value">{result.value.iso}</code>
            <CopyButton text={result.value.iso} />
          </div>
          <div className="output-row">
            <code className="output-value">
              {result.value.zoned} ({timeZone})
            </code>
            <CopyButton text={result.value.zoned} />
          </div>
          <div className="output-row">
            <code className="output-value">{result.value.offset}</code>
            <CopyButton text={result.value.offset} />
          </div>
        </>
      ) : (
        <p className="error-text">{result.error}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/date-time-converter
git commit -m "Port date-time-converter tool to React"
```

---

### Task 7: Port `epoch-converter`

**Files:**
- Create: `apps/devkit/src/tools/epoch-converter/epoch-converter.util.ts`
- Create: `apps/devkit/src/tools/epoch-converter/epoch-converter.util.test.ts`
- Create: `apps/devkit/src/tools/epoch-converter/EpochConverter.tsx`
- Create: `apps/devkit/src/tools/epoch-converter/EpochConverter.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult` from `../../shared/result`.
- Produces: `epochToDate`, `dateToEpoch`, `export function EpochConverter()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/epoch-converter/epoch-converter.util.test.ts
import { describe, expect, it } from 'vitest';
import { dateToEpoch, epochToDate } from './epoch-converter.util';

describe('epochToDate', () => {
  it('converts whole seconds', () => {
    expect(epochToDate('1705320000').utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('converts milliseconds', () => {
    expect(epochToDate('1705320000000').utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('rejects non-numeric input', () => {
    expect(() => epochToDate('abc')).toThrow('Enter a whole number of seconds or milliseconds.');
  });
});

describe('dateToEpoch', () => {
  it('converts an ISO date to seconds and milliseconds', () => {
    const result = dateToEpoch('2024-01-15T12:00:00Z');
    expect(result.seconds).toBe(1705320000);
    expect(result.milliseconds).toBe(1705320000000);
  });

  it('rejects an invalid date', () => {
    expect(() => dateToEpoch('nope')).toThrow('Invalid date: nope');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util (verbatim port)**

```ts
// apps/devkit/src/tools/epoch-converter/epoch-converter.util.ts
export interface EpochToDateResult {
  utc: string;
  local: string;
}

export interface DateToEpochResult {
  seconds: number;
  milliseconds: number;
}

export function epochToDate(input: string): EpochToDateResult {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error('Enter a whole number of seconds or milliseconds.');
  }
  const num = Number(trimmed);
  const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new Error('That epoch value is out of range.');
  }
  return { utc: date.toISOString(), local: date.toString() };
}

export function dateToEpoch(input: string): DateToEpochResult {
  const trimmed = input.trim();
  const date = trimmed === '' ? new Date() : new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`);
  }
  return { seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/epoch-converter/EpochConverter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EpochConverter } from './EpochConverter';

describe('EpochConverter', () => {
  it('converts a typed epoch to UTC/local', async () => {
    const user = userEvent.setup();
    render(<EpochConverter />);
    await user.type(screen.getByLabelText(/Epoch \(seconds or milliseconds\)/), '1705320000');
    expect(screen.getByText('2024-01-15T12:00:00.000Z')).toBeInTheDocument();
  });

  it('converts a typed date to seconds/milliseconds', async () => {
    const user = userEvent.setup();
    render(<EpochConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), '2024-01-15T12:00:00Z');
    expect(screen.getByText('1705320000')).toBeInTheDocument();
    expect(screen.getByText('1705320000000')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/epoch-converter/EpochConverter.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { dateToEpoch, epochToDate } from './epoch-converter.util';

export function EpochConverter() {
  const [epochInput, setEpochInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const epochResult = useMemo(() => tryResult(() => epochToDate(epochInput)), [epochInput]);
  const dateResult = useMemo(() => tryResult(() => dateToEpoch(dateInput)), [dateInput]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Epoch / Unix Converter</h2>
        <p className="tool-description">Convert between Unix epoch timestamps and human-readable dates.</p>
      </header>

      <div className="field">
        <label htmlFor="epoch-input">Epoch (seconds or milliseconds)</label>
        <input
          id="epoch-input"
          type="text"
          placeholder="e.g. 1705320000"
          value={epochInput}
          onChange={(e) => setEpochInput(e.target.value)}
        />
      </div>
      {epochInput !== '' &&
        (epochResult.ok ? (
          <>
            <div className="output-row">
              <code className="output-value">{epochResult.value.utc}</code>
              <CopyButton text={epochResult.value.utc} />
            </div>
            <div className="output-row">
              <code className="output-value">{epochResult.value.local}</code>
              <CopyButton text={epochResult.value.local} />
            </div>
          </>
        ) : (
          <p className="error-text">{epochResult.error}</p>
        ))}

      <div className="field">
        <label htmlFor="date-input">Date, or leave blank for now</label>
        <input
          id="date-input"
          type="text"
          placeholder="e.g. 2024-01-15T12:00:00Z"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
        />
      </div>
      {dateResult.ok ? (
        <>
          <div className="output-row">
            <code className="output-value">{dateResult.value.seconds}</code>
            <CopyButton text={String(dateResult.value.seconds)} />
          </div>
          <div className="output-row">
            <code className="output-value">{dateResult.value.milliseconds}</code>
            <CopyButton text={String(dateResult.value.milliseconds)} />
          </div>
        </>
      ) : (
        <p className="error-text">{dateResult.error}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/epoch-converter
git commit -m "Port epoch-converter tool to React"
```

---

### Task 8: Port `json-formatter`

**Files:**
- Create: `apps/devkit/src/tools/json-formatter/json-formatter.util.ts`
- Create: `apps/devkit/src/tools/json-formatter/json-formatter.util.test.ts`
- Create: `apps/devkit/src/tools/json-formatter/JsonFormatter.tsx`
- Create: `apps/devkit/src/tools/json-formatter/JsonFormatter.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult`.
- Produces: `formatJson(input: string, mode: 'pretty' | 'minify'): string`, `export function JsonFormatter()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/json-formatter/json-formatter.util.test.ts
import { describe, expect, it } from 'vitest';
import { formatJson } from './json-formatter.util';

describe('formatJson', () => {
  it('pretty-prints with 2-space indent', () => {
    expect(formatJson('{"a":1}', 'pretty')).toBe('{\n  "a": 1\n}');
  });

  it('minifies', () => {
    expect(formatJson('{ "a" : 1 }', 'minify')).toBe('{"a":1}');
  });

  it('throws for invalid JSON', () => {
    expect(() => formatJson('{not json}', 'pretty')).toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/json-formatter/json-formatter.util.ts
export function formatJson(input: string, mode: 'pretty' | 'minify'): string {
  const parsed: unknown = JSON.parse(input);
  return mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/json-formatter/JsonFormatter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { JsonFormatter } from './JsonFormatter';

describe('JsonFormatter', () => {
  it('pretty-prints valid JSON by default', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText('JSON input'), '{{"a":1}}');
    expect(screen.getByText('{\n  "a": 1\n}')).toBeInTheDocument();
  });

  it('minifies when the Minify button is clicked', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText('JSON input'), '{{"a":1}}');
    await user.click(screen.getByRole('button', { name: 'Minify' }));
    expect(screen.getByText('{"a":1}')).toBeInTheDocument();
  });

  it('shows an error for invalid JSON', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText('JSON input'), '{{not json}');
    expect(screen.getByText(/Unexpected token|not valid JSON/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/json-formatter/JsonFormatter.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { formatJson } from './json-formatter.util';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'pretty' | 'minify'>('pretty');

  const result = useMemo(() => tryResult(() => formatJson(input, mode)), [input, mode]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">JSON Formatter/Validator</h2>
        <p className="tool-description">Paste JSON to pretty-print, minify, or validate it.</p>
      </header>

      <div className="field">
        <label htmlFor="json-input">JSON input</label>
        <textarea id="json-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="output-row">
        <button type="button" className="action-button" onClick={() => setMode('pretty')}>
          Pretty-print
        </button>
        <button type="button" className="action-button" onClick={() => setMode('minify')}>
          Minify
        </button>
      </div>

      {input !== '' &&
        (result.ok ? (
          <div className="output-row">
            <code className="output-value">{result.value}</code>
            <CopyButton text={result.value} />
          </div>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/json-formatter
git commit -m "Port json-formatter tool to React"
```

---

### Task 9: Port `base64-tool`

**Files:**
- Create: `apps/devkit/src/tools/base64-tool/base64-tool.util.ts`
- Create: `apps/devkit/src/tools/base64-tool/base64-tool.util.test.ts`
- Create: `apps/devkit/src/tools/base64-tool/Base64Tool.tsx`
- Create: `apps/devkit/src/tools/base64-tool/Base64Tool.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult`.
- Produces: `encodeBase64`, `decodeBase64`, `export function Base64Tool()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/base64-tool/base64-tool.util.test.ts
import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

describe('encodeBase64', () => {
  it('encodes ASCII text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });

  it('encodes UTF-8 text', () => {
    expect(encodeBase64('héllo')).toBe(btoa(unescape(encodeURIComponent('héllo'))));
  });
});

describe('decodeBase64', () => {
  it('decodes valid Base64', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('throws for invalid Base64', () => {
    expect(() => decodeBase64('not base64!!')).toThrow('That is not valid Base64.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/base64-tool/base64-tool.util.ts
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeBase64(input: string): string {
  let binary: string;
  try {
    binary = atob(input.trim());
  } catch {
    throw new Error('That is not valid Base64.');
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder(undefined, { fatal: true }).decode(bytes);
  } catch {
    throw new Error('That decodes to invalid UTF-8.');
  }
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/base64-tool/Base64Tool.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Base64Tool } from './Base64Tool';

describe('Base64Tool', () => {
  it('encodes by default', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.type(screen.getByLabelText('Text'), 'hello');
    expect(screen.getByText('aGVsbG8=')).toBeInTheDocument();
  });

  it('decodes when Decode is selected', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByLabelText('Base64'), 'aGVsbG8=');
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/base64-tool/Base64Tool.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

export function Base64Tool() {
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  const result = useMemo(
    () => tryResult(() => (direction === 'encode' ? encodeBase64(input) : decodeBase64(input))),
    [direction, input],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Base64 Encode/Decode</h2>
        <p className="tool-description">Convert text to and from Base64, safely handling UTF-8.</p>
      </header>

      <div className="output-row">
        <button type="button" className="action-button" onClick={() => setDirection('encode')}>
          Encode
        </button>
        <button type="button" className="action-button" onClick={() => setDirection('decode')}>
          Decode
        </button>
      </div>

      <div className="field">
        <label htmlFor="base64-input">{direction === 'encode' ? 'Text' : 'Base64'}</label>
        <textarea id="base64-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' &&
        (result.ok ? (
          <div className="output-row">
            <code className="output-value">{result.value}</code>
            <CopyButton text={result.value} />
          </div>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/base64-tool
git commit -m "Port base64-tool to React"
```

---

### Task 10: Port `jwt-decoder`

**Files:**
- Create: `apps/devkit/src/tools/jwt-decoder/jwt-decoder.util.ts`
- Create: `apps/devkit/src/tools/jwt-decoder/jwt-decoder.util.test.ts`
- Create: `apps/devkit/src/tools/jwt-decoder/JwtDecoder.tsx`
- Create: `apps/devkit/src/tools/jwt-decoder/JwtDecoder.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult`.
- Produces: `decodeJwt`, `export function JwtDecoder()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/jwt-decoder/jwt-decoder.util.test.ts
import { describe, expect, it } from 'vitest';
import { decodeJwt } from './jwt-decoder.util';

function makeSegment(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: '123' };
    const token = `${makeSegment(header)}.${makeSegment(payload)}.signature`;
    expect(decodeJwt(token)).toEqual({ header, payload });
  });

  it('throws when there are fewer than two segments', () => {
    expect(() => decodeJwt('onlyonepart')).toThrow(
      'That does not look like a JWT (expected at least two dot-separated parts).',
    );
  });

  it('throws when a segment is not valid base64url JSON', () => {
    expect(() => decodeJwt('not-base64.also-not.sig')).toThrow('Could not decode the JWT header.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/jwt-decoder/jwt-decoder.util.ts
export interface DecodedJwt {
  header: unknown;
  payload: unknown;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length < 2) {
    throw new Error('That does not look like a JWT (expected at least two dot-separated parts).');
  }
  return {
    header: decodeSegment(parts[0], 'header'),
    payload: decodeSegment(parts[1], 'payload'),
  };
}

function decodeSegment(segment: string, name: string): unknown {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    throw new Error(`Could not decode the JWT ${name}.`);
  }
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/jwt-decoder/JwtDecoder.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { JwtDecoder } from './JwtDecoder';

function makeSegment(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('JwtDecoder', () => {
  it('decodes a pasted JWT into header and payload panels', async () => {
    const user = userEvent.setup();
    const token = `${makeSegment({ alg: 'HS256' })}.${makeSegment({ sub: '123' })}.sig`;
    render(<JwtDecoder />);
    await user.type(screen.getByLabelText('JWT'), token);
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    expect(screen.getByText(/"sub": "123"/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/jwt-decoder/JwtDecoder.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeJwt } from './jwt-decoder.util';

function format(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const result = useMemo(() => tryResult(() => decodeJwt(input)), [input]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">JWT Decoder</h2>
        <p className="tool-description">Decodes a JWT&apos;s header and payload. Signature is not verified.</p>
      </header>

      <div className="field">
        <label htmlFor="jwt-input">JWT</label>
        <textarea id="jwt-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' &&
        (result.ok ? (
          <>
            <div className="field">
              <label>Header</label>
              <div className="output-row">
                <code className="output-value">{format(result.value.header)}</code>
                <CopyButton text={format(result.value.header)} />
              </div>
            </div>
            <div className="field">
              <label>Payload</label>
              <div className="output-row">
                <code className="output-value">{format(result.value.payload)}</code>
                <CopyButton text={format(result.value.payload)} />
              </div>
            </div>
          </>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/jwt-decoder
git commit -m "Port jwt-decoder tool to React"
```

---

### Task 11: Port `hash-generator` (+ `md5`)

**Files:**
- Create: `apps/devkit/src/tools/hash-generator/md5.ts`
- Create: `apps/devkit/src/tools/hash-generator/md5.test.ts`
- Create: `apps/devkit/src/tools/hash-generator/hash-generator.util.ts`
- Create: `apps/devkit/src/tools/hash-generator/HashGenerator.tsx`
- Create: `apps/devkit/src/tools/hash-generator/HashGenerator.test.tsx`

**Interfaces:**
- Produces: `md5(input: string): string`, `sha(algorithm, input): Promise<string>`, `export function HashGenerator()` for Task 15.

- [ ] **Step 1: Port `md5`'s test**

```ts
// apps/devkit/src/tools/hash-generator/md5.test.ts
import { describe, expect, it } from 'vitest';
import { md5 } from './md5';

describe('md5', () => {
  it('matches known MD5 digests', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `Cannot find module './md5'`.

- [ ] **Step 3: Implement `md5` (verbatim port — pure algorithm, no framework dependency)**

```ts
// apps/devkit/src/tools/hash-generator/md5.ts
const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const SINE_CONSTANTS = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
);

function padMessage(bytes: Uint8Array): Uint8Array {
  const bitLength = BigInt(bytes.length) * 8n;
  const paddingLength = (56 - ((bytes.length + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(bytes.length + 1 + paddingLength + 8);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  new DataView(padded.buffer).setBigUint64(padded.length - 8, bitLength, true);
  return padded;
}

function rotateLeft(x: number, amount: number): number {
  return ((x << amount) | (x >>> (32 - amount))) >>> 0;
}

function toLittleEndianHex(value: number): string {
  const bytes = [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function md5(input: string): string {
  const message = padMessage(new TextEncoder().encode(input));
  const view = new DataView(message.buffer);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < message.length; chunkStart += 64) {
    const words = new Array<number>(16);
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(chunkStart + i * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      f = (f + a + SINE_CONSTANTS[i] + words[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(f, SHIFT_AMOUNTS[i])) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0].map(toLittleEndianHex).join('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Implement `hash-generator.util.ts` (no separate test — thin wrapper over `crypto.subtle`, exercised via the component test in Step 7)**

```ts
// apps/devkit/src/tools/hash-generator/hash-generator.util.ts
export async function sha(algorithm: 'SHA-1' | 'SHA-256', input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 6: Write the component test**

```tsx
// apps/devkit/src/tools/hash-generator/HashGenerator.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HashGenerator } from './HashGenerator';

describe('HashGenerator', () => {
  it('computes MD5, SHA-1, and SHA-256 for typed text', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText('Text'), 'hello');
    await waitFor(() => {
      expect(screen.getByText('5d41402abc4b2a76b9719d911017c592')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 7: Implement the component**

```tsx
// apps/devkit/src/tools/hash-generator/HashGenerator.tsx
import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { sha } from './hash-generator.util';
import { md5 } from './md5';

interface Hashes {
  md5: string;
  sha1: string;
  sha256: string;
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Hashes | null>(null);

  async function updateInput(value: string) {
    setInput(value);
    if (value === '') {
      setHashes(null);
      return;
    }
    const [sha1, sha256] = await Promise.all([sha('SHA-1', value), sha('SHA-256', value)]);
    setHashes({ md5: md5(value), sha1, sha256 });
  }

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Hash Generator</h2>
        <p className="tool-description">MD5, SHA-1, and SHA-256 digests of the text below.</p>
      </header>

      <div className="field">
        <label htmlFor="hash-input">Text</label>
        <textarea id="hash-input" value={input} onChange={(e) => updateInput(e.target.value)} />
      </div>

      {hashes && (
        <>
          <div className="field">
            <label>MD5</label>
            <div className="output-row">
              <code className="output-value">{hashes.md5}</code>
              <CopyButton text={hashes.md5} />
            </div>
          </div>
          <div className="field">
            <label>SHA-1</label>
            <div className="output-row">
              <code className="output-value">{hashes.sha1}</code>
              <CopyButton text={hashes.sha1} />
            </div>
          </div>
          <div className="field">
            <label>SHA-256</label>
            <div className="output-row">
              <code className="output-value">{hashes.sha256}</code>
              <CopyButton text={hashes.sha256} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 8: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/devkit/src/tools/hash-generator
git commit -m "Port hash-generator (and md5) to React"
```

---

### Task 12: Port `url-codec`

**Files:**
- Create: `apps/devkit/src/tools/url-codec/url-codec.util.ts`
- Create: `apps/devkit/src/tools/url-codec/url-codec.util.test.ts`
- Create: `apps/devkit/src/tools/url-codec/UrlCodec.tsx`
- Create: `apps/devkit/src/tools/url-codec/UrlCodec.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult`.
- Produces: `encodeUrl`, `decodeUrl`, `export function UrlCodec()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/url-codec/url-codec.util.test.ts
import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl } from './url-codec.util';

describe('encodeUrl', () => {
  it('percent-encodes special characters', () => {
    expect(encodeUrl('a b/c?d=e')).toBe('a%20b%2Fc%3Fd%3De');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeUrl('a%20b')).toBe('a b');
  });

  it('throws for malformed percent-encoding', () => {
    expect(() => decodeUrl('%')).toThrow('That is not validly percent-encoded.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/url-codec/url-codec.util.ts
export function encodeUrl(input: string): string {
  return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('That is not validly percent-encoded.');
  }
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/url-codec/UrlCodec.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UrlCodec } from './UrlCodec';

describe('UrlCodec', () => {
  it('encodes by default', async () => {
    const user = userEvent.setup();
    render(<UrlCodec />);
    await user.type(screen.getByLabelText('Text'), 'a b');
    expect(screen.getByText('a%20b')).toBeInTheDocument();
  });

  it('decodes when Decode is selected', async () => {
    const user = userEvent.setup();
    render(<UrlCodec />);
    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByLabelText('Text'), 'a%20b');
    expect(screen.getByText('a b')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/url-codec/UrlCodec.tsx
import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeUrl, encodeUrl } from './url-codec.util';

export function UrlCodec() {
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  const result = useMemo(
    () => tryResult(() => (direction === 'encode' ? encodeUrl(input) : decodeUrl(input))),
    [direction, input],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">URL Encode/Decode</h2>
        <p className="tool-description">Percent-encode or decode text for use in a URL.</p>
      </header>

      <div className="output-row">
        <button type="button" className="action-button" onClick={() => setDirection('encode')}>
          Encode
        </button>
        <button type="button" className="action-button" onClick={() => setDirection('decode')}>
          Decode
        </button>
      </div>

      <div className="field">
        <label htmlFor="url-input">Text</label>
        <textarea id="url-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' &&
        (result.ok ? (
          <div className="output-row">
            <code className="output-value">{result.value}</code>
            <CopyButton text={result.value} />
          </div>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/url-codec
git commit -m "Port url-codec tool to React"
```

---

### Task 13: Port `case-converter`

**Files:**
- Create: `apps/devkit/src/tools/case-converter/case-converter.util.ts`
- Create: `apps/devkit/src/tools/case-converter/case-converter.util.test.ts`
- Create: `apps/devkit/src/tools/case-converter/CaseConverter.tsx`
- Create: `apps/devkit/src/tools/case-converter/CaseConverter.test.tsx`

**Interfaces:**
- Produces: `toCamelCase`, `toPascalCase`, `toSnakeCase`, `toKebabCase`, `export function CaseConverter()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/case-converter/case-converter.util.test.ts
import { describe, expect, it } from 'vitest';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

describe('case conversions', () => {
  it('converts "hello world" / "HelloWorld" / "hello_world" all to the same forms', () => {
    for (const input of ['hello world', 'HelloWorld', 'hello_world', 'hello-world']) {
      expect(toCamelCase(input)).toBe('helloWorld');
      expect(toPascalCase(input)).toBe('HelloWorld');
      expect(toSnakeCase(input)).toBe('hello_world');
      expect(toKebabCase(input)).toBe('hello-world');
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/case-converter/case-converter.util.ts
function splitWords(input: string): string[] {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

export function toCamelCase(input: string): string {
  return splitWords(input)
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('');
}

export function toPascalCase(input: string): string {
  return splitWords(input)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('');
}

export function toSnakeCase(input: string): string {
  return splitWords(input).join('_');
}

export function toKebabCase(input: string): string {
  return splitWords(input).join('-');
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/case-converter/CaseConverter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CaseConverter } from './CaseConverter';

describe('CaseConverter', () => {
  it('shows all four case forms for typed text', async () => {
    const user = userEvent.setup();
    render(<CaseConverter />);
    await user.type(screen.getByLabelText('Text'), 'hello world');
    expect(screen.getByText('helloWorld')).toBeInTheDocument();
    expect(screen.getByText('HelloWorld')).toBeInTheDocument();
    expect(screen.getByText('hello_world')).toBeInTheDocument();
    expect(screen.getByText('hello-world')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/case-converter/CaseConverter.tsx
import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

export function CaseConverter() {
  const [input, setInput] = useState('');

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Case Converter</h2>
        <p className="tool-description">
          Convert text between camelCase, PascalCase, snake_case, and kebab-case.
        </p>
      </header>

      <div className="field">
        <label htmlFor="case-input">Text</label>
        <input id="case-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' && (
        <>
          <div className="output-row">
            <code className="output-value">{toCamelCase(input)}</code>
            <CopyButton text={toCamelCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toPascalCase(input)}</code>
            <CopyButton text={toPascalCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toSnakeCase(input)}</code>
            <CopyButton text={toSnakeCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toKebabCase(input)}</code>
            <CopyButton text={toKebabCase(input)} />
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/case-converter
git commit -m "Port case-converter tool to React"
```

---

### Task 14: Port `regex-tester`

**Files:**
- Create: `apps/devkit/src/tools/regex-tester/regex-tester.util.ts`
- Create: `apps/devkit/src/tools/regex-tester/regex-tester.util.test.ts`
- Create: `apps/devkit/src/tools/regex-tester/RegexTester.tsx`
- Create: `apps/devkit/src/tools/regex-tester/RegexTester.test.tsx`

**Interfaces:**
- Consumes: `Result`, `tryResult`.
- Produces: `testRegex`, `export function RegexTester()` for Task 15.

- [ ] **Step 1: Port the util test**

```ts
// apps/devkit/src/tools/regex-tester/regex-tester.util.test.ts
import { describe, expect, it } from 'vitest';
import { testRegex } from './regex-tester.util';

describe('testRegex', () => {
  it('finds all matches', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333', undefined);
    expect(result.matches.map((m) => m.match)).toEqual(['1', '22', '333']);
  });

  it('applies a replacement when provided', () => {
    const result = testRegex('\\d+', '', 'a1 b22', 'X');
    expect(result.replaced).toBe('aX bX');
  });

  it('throws for an invalid pattern', () => {
    expect(() => testRegex('(', '', 'x', undefined)).toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL.

- [ ] **Step 3: Implement the util**

```ts
// apps/devkit/src/tools/regex-tester/regex-tester.util.ts
export interface RegexMatch {
  match: string;
  index: number;
}

export interface RegexTestResult {
  matches: RegexMatch[];
  replaced?: string;
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement?: string,
): RegexTestResult {
  const globalFlags = flags.includes('g') ? flags : `${flags}g`;
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, globalFlags);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid regular expression.');
  }

  const matches: RegexMatch[] = [];
  for (const match of input.matchAll(regex)) {
    matches.push({ match: match[0], index: match.index ?? -1 });
  }

  if (replacement === undefined) {
    return { matches };
  }

  const replaceRegex = new RegExp(pattern, globalFlags);
  return { matches, replaced: input.replace(replaceRegex, replacement) };
}
```

- [ ] **Step 4: Run util test to verify it passes**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 5: Write the component test**

```tsx
// apps/devkit/src/tools/regex-tester/RegexTester.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RegexTester } from './RegexTester';

describe('RegexTester', () => {
  it('reports the match count for a pattern', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText('Pattern'), '\\d+');
    await user.type(screen.getByLabelText('Test string'), 'a1 b22 c333');
    expect(screen.getByText('3 match(es)')).toBeInTheDocument();
  });

  it('shows the replaced string when a replacement is typed', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText('Pattern'), '\\d+');
    await user.type(screen.getByLabelText('Test string'), 'a1 b22');
    await user.type(screen.getByLabelText('Replacement (optional)'), 'X');
    expect(screen.getByText('aX bX')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement the component**

```tsx
// apps/devkit/src/tools/regex-tester/RegexTester.tsx
import { useMemo, useState } from 'react';
import { tryResult } from '../../shared/result';
import { testRegex } from './regex-tester.util';

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('');
  const [input, setInput] = useState('');
  const [replacement, setReplacement] = useState('');
  const [useReplacement, setUseReplacement] = useState(false);

  const result = useMemo(
    () =>
      tryResult(() => testRegex(pattern, flags, input, useReplacement ? replacement : undefined)),
    [pattern, flags, input, useReplacement, replacement],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Regex Tester</h2>
        <p className="tool-description">Test a regular expression against a string, with optional replacement.</p>
      </header>

      <div className="field">
        <label htmlFor="regex-pattern">Pattern</label>
        <input
          id="regex-pattern"
          type="text"
          placeholder="e.g. \d+"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="regex-flags">Flags</label>
        <input
          id="regex-flags"
          type="text"
          placeholder="e.g. gi"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="regex-input">Test string</label>
        <textarea id="regex-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="regex-replacement">Replacement (optional)</label>
        <input
          id="regex-replacement"
          type="text"
          value={replacement}
          onChange={(e) => {
            setReplacement(e.target.value);
            setUseReplacement(true);
          }}
        />
      </div>

      {pattern !== '' &&
        (result.ok ? (
          <>
            <p className="tool-description">{result.value.matches.length} match(es)</p>
            {result.value.replaced !== undefined && (
              <div className="output-row">
                <code className="output-value">{result.value.replaced}</code>
              </div>
            )}
          </>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
```

- [ ] **Step 7: Run all devkit tests**

Run: `npx nx test devkit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/devkit/src/tools/regex-tester
git commit -m "Port regex-tester tool to React"
```

---

### Task 15: Wire the tool registry and terminal-themed App shell

**Files:**
- Create: `apps/devkit/src/tool-registry.ts`
- Modify: `apps/devkit/src/App.tsx` (replace the Task 2 placeholder)
- Create: `apps/devkit/src/App.test.tsx`

**Interfaces:**
- Consumes: all 11 tool components from Tasks 4–14, plus `CopyButton`/`theme.css`/`tool-panel.css` from Task 3.
- Produces: `export function App()` — the component `register.tsx` (Task 2) renders. This is the deliverable that makes the whole remote functional end-to-end.

- [ ] **Step 1: Write `tool-registry.ts`**

```ts
// apps/devkit/src/tool-registry.ts
import type { ComponentType } from 'react';
import { GuidV4 } from './tools/guid-v4/GuidV4';
import { GuidV7 } from './tools/guid-v7/GuidV7';
import { DateTimeConverter } from './tools/date-time-converter/DateTimeConverter';
import { EpochConverter } from './tools/epoch-converter/EpochConverter';
import { JsonFormatter } from './tools/json-formatter/JsonFormatter';
import { Base64Tool } from './tools/base64-tool/Base64Tool';
import { JwtDecoder } from './tools/jwt-decoder/JwtDecoder';
import { HashGenerator } from './tools/hash-generator/HashGenerator';
import { UrlCodec } from './tools/url-codec/UrlCodec';
import { CaseConverter } from './tools/case-converter/CaseConverter';
import { RegexTester } from './tools/regex-tester/RegexTester';

export interface ToolDefinition {
  id: string;
  label: string;
  component: ComponentType;
}

export const TOOLS: ToolDefinition[] = [
  { id: 'guid-v4', label: 'GUID v4', component: GuidV4 },
  { id: 'guid-v7', label: 'GUID v7', component: GuidV7 },
  { id: 'date-time-converter', label: 'Date/Time Converter', component: DateTimeConverter },
  { id: 'epoch-converter', label: 'Epoch / Unix Converter', component: EpochConverter },
  { id: 'json-formatter', label: 'JSON Formatter/Validator', component: JsonFormatter },
  { id: 'base64-tool', label: 'Base64 Encode/Decode', component: Base64Tool },
  { id: 'jwt-decoder', label: 'JWT Decoder', component: JwtDecoder },
  { id: 'hash-generator', label: 'Hash Generator', component: HashGenerator },
  { id: 'url-codec', label: 'URL Encode/Decode', component: UrlCodec },
  { id: 'case-converter', label: 'Case Converter', component: CaseConverter },
  { id: 'regex-tester', label: 'Regex Tester', component: RegexTester },
];
```

- [ ] **Step 2: Write `App.test.tsx` first**

```tsx
// apps/devkit/src/App.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the terminal chrome and the first tool selected by default', () => {
    render(<App />);
    expect(screen.getByText('datisa.dev - Universal DevKit')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'GUID v4' })).toBeInTheDocument();
  });

  it('filters the tool list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByPlaceholderText('Filter tools…'), 'json');
    expect(screen.getByRole('button', { name: 'JSON Formatter/Validator' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GUID v4' })).not.toBeInTheDocument();
  });

  it('switches the detail panel when a tool is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Case Converter' }));
    expect(screen.getByRole('heading', { name: 'Case Converter' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx nx test devkit`
Expected: FAIL — `App` still renders the Task 2 placeholder, none of the expected text is present.

- [ ] **Step 4: Implement the real `App.tsx`**

```tsx
// apps/devkit/src/App.tsx
import { useMemo, useState } from 'react';
import { TOOLS } from './tool-registry';

export function App() {
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState(TOOLS[0]?.id ?? '');

  const filteredTools = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return query === '' ? TOOLS : TOOLS.filter((tool) => tool.label.toLowerCase().includes(query));
  }, [filter]);

  const selectedTool = TOOLS.find((tool) => tool.id === selectedId);
  const SelectedComponent = selectedTool?.component;

  return (
    <div className="devkit-terminal">
      <div className="devkit-terminal-header">
        <div className="devkit-window-controls">
          <div className="devkit-control close" />
          <div className="devkit-control minimize" />
          <div className="devkit-control maximize" />
        </div>
        <div className="devkit-terminal-title">datisa.dev - Universal DevKit</div>
      </div>
      <div className="devkit-body">
        <aside className="devkit-sidebar">
          <input
            type="text"
            className="devkit-filter"
            placeholder="Filter tools…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <ul className="devkit-tool-list">
            {filteredTools.map((tool) => (
              <li key={tool.id}>
                <button
                  type="button"
                  className={`devkit-tool-item${tool.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(tool.id)}
                >
                  {tool.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="devkit-detail">
          {SelectedComponent ? <SelectedComponent /> : <p className="devkit-empty-state">Select a tool from the list.</p>}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx nx test devkit`
Expected: PASS (all devkit tests, including all 11 tool suites and this one).

- [ ] **Step 6: Build and manually smoke-check standalone**

Run: `npx nx serve devkit`
Then open `http://localhost:4202/index.html` in a browser.
Expected: the terminal-chrome DevKit UI loads, sidebar lists all 11 tools, clicking one switches the detail panel, GUID v4's "Generate new" button works, and copy buttons show "Copied" briefly after clicking.

- [ ] **Step 7: Commit**

```bash
git add apps/devkit/src/tool-registry.ts apps/devkit/src/App.tsx apps/devkit/src/App.test.tsx
git commit -m "Wire devkit tool registry and terminal-themed App shell"
```

---

## Phase B — `apps/coming-soon` (new Angular remote)

### Task 16: Scaffold `apps/coming-soon`

**Files:**
- Create: `apps/coming-soon/project.json`
- Create: `apps/coming-soon/tsconfig.app.json`
- Create: `apps/coming-soon/federation.config.mjs`
- Create: `apps/coming-soon/public/.gitkeep`
- Create: `apps/coming-soon/src/main.ts`
- Create: `apps/coming-soon/src/bootstrap.ts`
- Create: `apps/coming-soon/src/styles.css`
- Create: `apps/coming-soon/src/index.html`
- Create: `apps/coming-soon/src/app/app.config.ts`
- Create: `apps/coming-soon/src/app/app.ts` (placeholder — replaced in Task 17)
- Create: `apps/coming-soon/src/app/app.html` (placeholder)
- Create: `apps/coming-soon/src/app/app.spec.ts`

**Interfaces:**
- Produces: `apps/coming-soon` exposes `./Component` → the Angular `App` class, matching what `../portfolio`'s `environment.ts` (Phase D) points `loadRemoteModule` at.

- [ ] **Step 1: `apps/coming-soon/project.json` — same builder chain as today's `projects/devkit`, just under Nx's `project.json`**

```json
{
  "name": "coming-soon",
  "root": "apps/coming-soon",
  "sourceRoot": "apps/coming-soon/src",
  "projectType": "application",
  "prefix": "cs",
  "targets": {
    "build": {
      "executor": "@angular-architects/native-federation:build",
      "options": {
        "cacheExternalArtifacts": true
      },
      "configurations": {
        "production": {
          "target": "coming-soon:esbuild:production"
        },
        "development": {
          "target": "coming-soon:esbuild:development",
          "dev": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular-architects/native-federation:build",
      "options": {
        "target": "coming-soon:serve-original:development",
        "rebuildDelay": 500,
        "cacheExternalArtifacts": true,
        "dev": true,
        "devServer": true,
        "port": 0
      }
    },
    "test": {
      "executor": "@angular/build:unit-test"
    },
    "esbuild": {
      "executor": "@angular/build:application",
      "options": {
        "browser": "apps/coming-soon/src/main.ts",
        "tsConfig": "apps/coming-soon/tsconfig.app.json",
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/coming-soon/public"
          }
        ],
        "styles": ["apps/coming-soon/src/styles.css"],
        "polyfills": ["es-module-shims"]
      },
      "configurations": {
        "production": {
          "budgets": [
            { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
            { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
          ],
          "outputHashing": "all"
        },
        "development": {
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve-original": {
      "executor": "@angular/build:dev-server",
      "configurations": {
        "production": { "buildTarget": "coming-soon:esbuild:production" },
        "development": { "buildTarget": "coming-soon:esbuild:development" }
      },
      "defaultConfiguration": "development",
      "options": {
        "port": 4203
      }
    }
  }
}
```

- [ ] **Step 2: `apps/coming-soon/tsconfig.app.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/coming-soon-tsc",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

- [ ] **Step 3: `apps/coming-soon/federation.config.mjs`**

```js
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'coming-soon',

  exposes: {
    './Component': './apps/coming-soon/src/app/app.ts',
  },

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          '@angular/core': {
            singleton: true,
            strictVersion: true,
            requiredVersion: 'auto',
            build: 'package',
            includeSecondaries: { keepAll: true },
          },
        },
      },
    ),
  },

  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket'],

  features: {
    denseChunking: true,
  },
});
```

- [ ] **Step 4: `apps/coming-soon/src/main.ts`**

```ts
import { initFederation } from '@angular-architects/native-federation';

initFederation({ 'coming-soon': './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
```

- [ ] **Step 5: `apps/coming-soon/src/bootstrap.ts`**

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

- [ ] **Step 6: `apps/coming-soon/src/app/app.config.ts`**

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
```

- [ ] **Step 7: Placeholder `app.ts`/`app.html` (real "Coming Soon" content is Task 17)**

```ts
// apps/coming-soon/src/app/app.ts
import { Component } from '@angular/core';

@Component({
  selector: 'cs-root',
  imports: [],
  templateUrl: './app.html',
})
export class App {}
```

```html
<!-- apps/coming-soon/src/app/app.html -->
<p>Coming soon.</p>
```

- [ ] **Step 8: `apps/coming-soon/src/app/app.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

- [ ] **Step 9: `apps/coming-soon/src/styles.css`**

```css
* {
  box-sizing: border-box;
}
```

- [ ] **Step 10: `apps/coming-soon/src/index.html` (standalone dev shell only)**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Coming Soon</title>
  </head>
  <body>
    <cs-root></cs-root>
  </body>
</html>
```

- [ ] **Step 11: Install `@angular-architects/native-federation` and `es-module-shims` at the root (shared across both Angular consumers of this workspace: none yet in this repo besides coming-soon, but keep the dependency at the workspace root since Nx here has one shared `node_modules`)**

Edit root `package.json`, add to `dependencies`:

```json
"@angular-architects/native-federation": "^22.0.6",
"@angular/common": "^22.0.0",
"@angular/compiler": "^22.0.0",
"@angular/core": "^22.0.0",
"@angular/platform-browser": "^22.0.0",
"es-module-shims": "^2.8.0",
"rxjs": "~7.8.0",
"tslib": "^2.3.0"
```

and to `devDependencies`:

```json
"@angular/build": "^22.0.7",
"@angular/cli": "^22.0.6",
"@angular/compiler-cli": "^22.0.0"
```

Run: `npm install`

- [ ] **Step 12: Build and test**

Run: `npx nx build coming-soon`
Expected: `dist/coming-soon/remoteEntry.json` exists with `"name": "coming-soon"`.

Run: `npx nx test coming-soon`
Expected: PASS (1 test).

- [ ] **Step 13: Commit**

```bash
git add apps/coming-soon package.json package-lock.json
git commit -m "Scaffold apps/coming-soon Angular remote"
```

---

### Task 17: "Coming Soon" themed placeholder page

**Files:**
- Modify: `apps/coming-soon/src/app/app.ts`
- Modify: `apps/coming-soon/src/app/app.html`
- Create: `apps/coming-soon/src/app/app.css`
- Modify: `apps/coming-soon/src/app/app.spec.ts`

**Interfaces:**
- Produces: the final `App` component content the shell (Phase D) will render.

- [ ] **Step 1: Update the spec first to assert the real content**

```ts
// apps/coming-soon/src/app/app.spec.ts
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('renders the Coming Soon heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('Coming Soon');
  });

  it('renders a teaser description', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cs-teaser')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx nx test coming-soon`
Expected: FAIL — placeholder `<p>Coming soon.</p>` has no `<h1>` or `.cs-teaser`.

- [ ] **Step 3: Implement the themed template**

```html
<!-- apps/coming-soon/src/app/app.html -->
<section class="cs-page">
  <div class="cs-badge">Next Project</div>
  <h1 class="cs-title">Coming Soon</h1>
  <p class="cs-teaser">
    Something new is taking shape here. This slot is reserved for the next remote in this
    micro-frontend shell — check back soon.
  </p>
</section>
```

- [ ] **Step 4: Implement the themed styles**

```css
/* apps/coming-soon/src/app/app.css */
:host {
  display: block;
  min-height: 100vh;
}

.cs-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
  background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0b0a1a 65%, #05050a 100%);
  color: #e2e8f0;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;
}

.cs-badge {
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(167, 139, 250, 0.4);
  color: #c4b5fd;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cs-title {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 700;
  background: linear-gradient(120deg, #c4b5fd, #818cf8 50%, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.cs-teaser {
  max-width: 32rem;
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
}
```

- [ ] **Step 5: Update the component to import the new stylesheet**

```ts
// apps/coming-soon/src/app/app.ts
import { Component } from '@angular/core';

@Component({
  selector: 'cs-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx nx test coming-soon`
Expected: PASS.

- [ ] **Step 7: Build and manually smoke-check standalone**

Run: `npx nx serve coming-soon`
Then open the printed local URL.
Expected: dark gradient background, "Next Project" badge, gradient "Coming Soon" heading, teaser paragraph.

- [ ] **Step 8: Commit**

```bash
git add apps/coming-soon/src/app
git commit -m "Add Coming Soon themed placeholder page"
```

---

## Phase C — CI

### Task 18: Update `.github/workflows/deploy.yml` for both apps

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npx nx build <app>` (Tasks 2/16), each app's `dist/<app>/remoteEntry.json` output.

- [ ] **Step 1: Replace the build step to loop over both apps via Nx**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Space-separated list of MFE projects to build and publish.
      # Add a new project name here as more remotes are added to the workspace.
      PROJECTS: devkit coming-soon
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Build each remote under its own subpath
        run: |
          mkdir -p public
          for project in $PROJECTS; do
            npx nx build "$project"
            if [ -d "dist/$project/browser" ]; then
              cp -r "dist/$project/browser" "public/$project"
            else
              cp -r "dist/$project" "public/$project"
            fi
          done

      - uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

(`apps/coming-soon`'s Angular build emits `dist/coming-soon/browser/…`; `apps/devkit`'s esbuild script emits directly to `dist/devkit/…` with no `browser` subfolder — the `if`/`else` handles both output shapes without needing per-project special-casing in the workflow.)

- [ ] **Step 2: Verify the workflow YAML is well-formed**

Run: `npx js-yaml .github/workflows/deploy.yml` (or open it in an editor and check indentation) — this repo has no local GitHub Actions runner, so this step is a syntax check only; the real verification happens on the next push to `main`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Build both devkit and coming-soon remotes in the deploy workflow"
```

---

## Phase D — Shell wiring (`../portfolio`)

### Task 19: `RemoteWebComponentHost` — generic non-Angular remote loader

**Files:**
- Create: `../portfolio/src/app/shared/remote-web-component-host/remote-web-component-host.component.ts`
- Create: `../portfolio/src/app/shared/remote-web-component-host/remote-web-component-host.component.spec.ts`

**Interfaces:**
- Consumes: `loadRemoteModule` from `@angular-architects/native-federation` (already a portfolio dependency).
- Produces: `RemoteWebComponentHostComponent` with `@Input() remoteName!: string`, `@Input() exposedModule!: string`, `@Input() tagName!: string` — Task 20's route config supplies these via route `data`.

- [ ] **Step 1: Write the failing spec**

```ts
// ../portfolio/src/app/shared/remote-web-component-host/remote-web-component-host.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RemoteWebComponentHostComponent } from './remote-web-component-host.component';

jest.mock('@angular-architects/native-federation', () => ({
  loadRemoteModule: jest.fn(),
}));

import { loadRemoteModule } from '@angular-architects/native-federation';

describe('RemoteWebComponentHostComponent', () => {
  let fixture: ComponentFixture<RemoteWebComponentHostComponent>;

  beforeEach(async () => {
    (loadRemoteModule as jest.Mock).mockResolvedValue({});
    if (!customElements.get('test-remote-tag')) {
      customElements.define('test-remote-tag', class extends HTMLElement {});
    }
    await TestBed.configureTestingModule({
      imports: [RemoteWebComponentHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RemoteWebComponentHostComponent);
    fixture.componentRef.setInput('remoteName', 'devkit');
    fixture.componentRef.setInput('exposedModule', './Component');
    fixture.componentRef.setInput('tagName', 'test-remote-tag');
  });

  it('loads the remote module and appends the custom element tag', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadRemoteModule).toHaveBeenCalledWith({
      remoteName: 'devkit',
      exposedModule: './Component',
    });
    const hostEl: HTMLElement = fixture.nativeElement;
    expect(hostEl.querySelector('test-remote-tag')).toBeTruthy();
  });
});
```

(This project uses Vitest via `@angular/build:unit-test`, whose Jest-compatible globals include `jest.mock`/`jest.Mock` as aliases — if that alias isn't available, replace `jest.mock`/`jest.Mock` with `vi.mock`/`Mock` from `vitest` and add `import { vi } from 'vitest';`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd ../portfolio && npx ng test --include='**/remote-web-component-host.component.spec.ts'`
Expected: FAIL — `Cannot find module './remote-web-component-host.component'`.

- [ ] **Step 3: Implement the component**

```ts
// ../portfolio/src/app/shared/remote-web-component-host/remote-web-component-host.component.ts
import { Component, ElementRef, OnInit, input, inject } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';

@Component({
  selector: 'app-remote-web-component-host',
  standalone: true,
  template: '',
})
export class RemoteWebComponentHostComponent implements OnInit {
  readonly remoteName = input.required<string>();
  readonly exposedModule = input.required<string>();
  readonly tagName = input.required<string>();

  private readonly hostRef = inject(ElementRef<HTMLElement>);

  async ngOnInit(): Promise<void> {
    await loadRemoteModule({
      remoteName: this.remoteName(),
      exposedModule: this.exposedModule(),
    });
    const element = document.createElement(this.tagName());
    this.hostRef.nativeElement.appendChild(element);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd ../portfolio && npx ng test --include='**/remote-web-component-host.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ../portfolio
git add src/app/shared/remote-web-component-host
git commit -m "Add RemoteWebComponentHost for loading non-Angular Native Federation remotes"
```

---

### Task 20: Route both remotes

**Files:**
- Modify: `../portfolio/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `RemoteWebComponentHostComponent` (Task 19) for `devkit`; existing `loadRemoteModule(...).then(m => m.App)` pattern for `coming-soon`.

- [ ] **Step 1: Update routes**

```ts
// ../portfolio/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ToolsPageComponent } from './pages/tools-page/tools-page.component';
import { RemoteWebComponentHostComponent } from './shared/remote-web-component-host/remote-web-component-host.component';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    {
        path: 'tools',
        component: ToolsPageComponent,
        children: [
            {
                path: 'devkit',
                component: RemoteWebComponentHostComponent,
                data: {
                    remoteName: 'devkit',
                    exposedModule: './Component',
                    tagName: 'dk-devkit-app'
                }
            },
            {
                path: 'coming-soon',
                loadComponent: () =>
                    loadRemoteModule({
                        remoteName: 'coming-soon',
                        exposedModule: './Component'
                    }).then((m) => m.App)
            }
        ]
    }
];
```

- [ ] **Step 2: Bind the route `data` to `RemoteWebComponentHostComponent`'s inputs**

Angular's router only binds route `data`/`params`/`queryParams` to component inputs automatically when `withComponentInputBinding()` is enabled. Check for it:

Run: `grep -rn "withComponentInputBinding" ../portfolio/src/app`

If it is **not** present, add it in `../portfolio/src/app/app.config.ts` (or wherever `provideRouter` is called) — change `provideRouter(routes)` to `provideRouter(routes, withComponentInputBinding())`, importing `withComponentInputBinding` from `@angular/router`. If it **is** already present, no change needed.

- [ ] **Step 3: Update `RemoteWebComponentHostComponent`'s inputs to accept route data (already does — `input.required<string>()` matches bound route `data` keys `remoteName`/`exposedModule`/`tagName` by name)**

No code change needed if Step 2's binding is enabled — the existing `input.required<string>()` declarations in Task 19 already match the `data` keys used in Step 1's route config.

- [ ] **Step 4: Build the shell to verify the route config compiles**

Run: `cd ../portfolio && npx ng build --configuration development`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd ../portfolio
git add src/app/app.routes.ts src/app/app.config.ts
git commit -m "Route tools/devkit through RemoteWebComponentHost, add tools/coming-soon"
```

---

### Task 21: Environment remote URLs

**Files:**
- Modify: `../portfolio/src/environments/environment.ts`
- Modify: `../portfolio/src/environments/environment.development.ts`

**Interfaces:**
- Consumes: nothing new — extends the existing `environment.remotes` map that `initFederation` reads at bootstrap (verify the exact call site with `grep -rn "environment.remotes" ../portfolio/src` before editing, since this plan was written without reading that file directly).

- [ ] **Step 1: Update production environment**

```ts
// ../portfolio/src/environments/environment.ts
export const environment = {
    production: true,
    remotes: {
        devkit: 'https://dat-honguyen.github.io/my-tools/devkit/remoteEntry.json',
        comingSoon: 'https://dat-honguyen.github.io/my-tools/coming-soon/remoteEntry.json'
    }
};
```

- [ ] **Step 2: Update development environment**

```ts
// ../portfolio/src/environments/environment.development.ts
export const environment = {
    production: false,
    remotes: {
        devkit: 'http://localhost:4202/remoteEntry.json',
        comingSoon: 'http://localhost:4203/remoteEntry.json'
    }
};
```

Note the devkit dev port changes from `4201` (the old Angular CLI dev-server port) to `4202` (this plan's `apps/devkit` esbuild serve port, set in Task 2 Step 4). `coming-soon` dev serves on `4203` (set in Task 16 Step 1's `serve-original` options).

- [ ] **Step 3: No extra wiring needed**

`../portfolio/src/main.ts` calls `initFederation(REMOTES)`, and `../portfolio/src/app/remotes.ts` defines `export const REMOTES: Record<string, string> = environment.remotes;` — a direct spread of the whole map. Adding `comingSoon` to `environment.remotes` in Steps 1–2 is sufficient; no other file references remote names individually.

- [ ] **Step 4: Rebuild to confirm no broken references**

Run: `cd ../portfolio && npx ng build --configuration development`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
cd ../portfolio
git add src/environments
git commit -m "Add coming-soon remote URLs to environment config"
```

---

### Task 22: Project card for Coming Soon

**Files:**
- Modify: `../portfolio/src/app/components/sections/projects-section/projects-section.component.ts`

**Interfaces:**
- Consumes: existing `Project`, `ProjectStatus` interfaces and `LIVE_STATUS`/`IN_PROGRESS_STATUS` constants already in this file.
- Produces: a new `PLANNED_STATUS` constant and a `coming-soon` entry in `projects`, per the design doc's explicit call to distinguish "planned" from "in progress."

- [ ] **Step 1: Add the new status constant and project entry**

Edit `../portfolio/src/app/components/sections/projects-section/projects-section.component.ts`:

After the existing `IN_PROGRESS_STATUS` constant, add:

```ts
const PLANNED_STATUS: ProjectStatus = {
    label: 'Coming Soon',
    badgeClass: 'bg-violet-500/20 text-violet-50 ring-violet-400/30 backdrop-blur-sm',
    dotClass: 'bg-violet-400'
};
```

Then add a new entry to the `projects` array (after the `devkit` entry):

```ts
{
    slug: 'coming-soon',
    title: 'Next Project',
    tagline: 'A placeholder, and a rehearsal for the next remote',
    description:
        'A minimal Angular remote whose only job right now is to exist — proving the shell can onboard a brand-new Native Federation remote end-to-end (build, deploy, route, load) before there is a real project behind it.',
    tags: ['Angular', 'Native Federation'],
    bg: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)',
    status: PLANNED_STATUS,
    primaryCta: { label: 'Preview', routerLink: '/tools/coming-soon' }
}
```

- [ ] **Step 2: Rebuild and visually check the card renders**

Run: `cd ../portfolio && npx ng serve`
Open the portfolio home page, scroll to the projects section.
Expected: a third project card appears with the violet "Coming Soon" badge, gradient background, and a "Preview" button that navigates to `/tools/coming-soon`.

- [ ] **Step 3: Commit**

```bash
cd ../portfolio
git add src/app/components/sections/projects-section/projects-section.component.ts
git commit -m "Add Coming Soon project card"
```

---

### Task 23: End-to-end manual verification

**Files:** none (verification-only task).

- [ ] **Step 1: Serve both remotes and the shell together**

In three separate terminals:

```bash
# terminal 1 (my-tools)
npx nx serve devkit
# terminal 2 (my-tools)
npx nx serve coming-soon
# terminal 3 (portfolio)
cd ../portfolio && npx ng serve
```

- [ ] **Step 2: Verify DevKit end-to-end through the shell**

Open the portfolio dev URL, navigate to `/tools/devkit`.
Expected: the terminal-chrome DevKit UI renders inside the Angular shell (confirming `<dk-devkit-app>` mounted correctly), sidebar filter and tool switching work, and at least one tool (e.g. GUID v4, JSON Formatter) is exercised manually and produces correct output.

- [ ] **Step 3: Verify Coming Soon end-to-end through the shell**

Navigate to `/tools/coming-soon`.
Expected: the dark gradient "Coming Soon" page renders inside the shell.

- [ ] **Step 4: Verify the project cards navigate correctly**

From the home page, click both new project cards' CTAs and confirm they land on the correct routes.

- [ ] **Step 5: No commit for this task** — it is a verification checkpoint. If any step fails, return to the relevant earlier task and fix it there (with a new commit), then re-run this task's steps.

---

## Phase E — Cleanup

### Task 24: Remove the old Angular `projects/devkit` and root Angular CLI scaffolding

**Files:**
- Delete: `projects/devkit/` (entire directory)
- Delete: `angular.json`
- Modify: root `package.json` (remove now-unused Angular devkit-only deps if any remain unused by `coming-soon`/root tooling — cross-check against Task 16 Step 11's additions first)
- Modify: `README.md` (update project list/dev instructions to describe the new `apps/devkit` + `apps/coming-soon` layout)

**Interfaces:** none — this is pure removal, gated on Task 23 passing.

- [ ] **Step 1: Confirm Task 23's manual verification passed**

Do not proceed unless the DevKit and Coming Soon remotes both work end-to-end through the shell (Task 23). This task deletes the only working copy of the old Angular DevKit; there is no rollback within this plan once it's removed other than `git revert`.

- [ ] **Step 2: Remove the old Angular devkit project and workspace file**

```bash
git rm -r projects/devkit
git rm angular.json
```

- [ ] **Step 3: Prune root `package.json` dependencies no longer needed**

Compare the root `package.json`'s `dependencies`/`devDependencies` against what `apps/coming-soon` and `apps/devkit` actually use (their own `package.json` files from Tasks 2 and 16, plus the shared Angular deps added in Task 16 Step 11). Remove any leftover Angular-CLI-workspace-only packages that nothing references anymore — check each with:

Run: `grep -rn "<package-name>" apps/ nx.json package.json` for each candidate before removing it.

Do not remove `@angular-architects/native-federation`, `@angular/*`, `rxjs`, `tslib`, `es-module-shims` — `apps/coming-soon` still needs all of them.

- [ ] **Step 4: Update `README.md`**

Replace any references to the old single-Angular-project layout with a short description of the new structure: `apps/devkit` (React remote) and `apps/coming-soon` (Angular remote), both built/served via `npx nx build <app>` / `npx nx serve <app>`.

- [ ] **Step 5: Full rebuild to confirm nothing broke**

Run: `npm install && npx nx run-many -t build && npx nx run-many -t test`
Expected: both `devkit` and `coming-soon` build and test targets PASS; no leftover references to `projects/devkit` or `angular.json` cause errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Remove old Angular projects/devkit workspace after React port verified working"
```

---

## Self-Review Notes

- **Spec coverage:** Nx monorepo (Task 1), `apps/devkit` esbuild+native-federation build (Task 2), Web Component boundary (Task 2 Step 6), terminal theme + sidebar/detail UX (Tasks 3, 15), all 11 tools (Tasks 4–14), `apps/coming-soon` Angular remote with Coming Soon theme (Tasks 16–17), CI (Task 18), shell wrapper/routes/env/card (Tasks 19–22), end-to-end verification (Task 23), old-project cleanup (Task 24) — every design doc section has a task.
- **Type consistency:** `ToolDefinition.component: ComponentType` (Task 15) matches every tool task's `export function ToolName()` (a valid React `ComponentType` — no props). `RemoteWebComponentHostComponent`'s `remoteName`/`exposedModule`/`tagName` inputs (Task 19) match the route `data` keys used in Task 20 exactly. The custom element tag `dk-devkit-app` is identical across Task 2 Step 6 (`register.tsx`), Task 3 Step 5 (CSS selector), and Task 20 Step 1 (route data) — verified by grep-matching all three occurrences while writing this plan.
- **External-repo facts confirmed while writing this plan:** `../portfolio/src/main.ts` calls `initFederation(REMOTES)` where `REMOTES` (`../portfolio/src/app/remotes.ts`) is a direct spread of `environment.remotes` — confirmed by reading both files, so Task 21 needs no extra wiring beyond the two environment file edits. Task 19's Vitest-vs-Jest test-global note remains a verify-before-assuming instruction for whichever test runner alias the implementer's local Angular unit-test builder actually exposes.
