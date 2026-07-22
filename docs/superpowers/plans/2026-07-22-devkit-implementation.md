# DevKit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `hello-world` Native Federation remote in `my-tools` into `devkit`, a real multi-tool developer-utilities app (11 tools), and rewire the `dat-honguyen.github.io` shell to load it under its new name.

**Architecture:** Two repos change. `my-tools` (this repo): `projects/hello-world` → `projects/devkit`, with a signal-driven (no Angular Router) sidebar + detail-panel shell rendering one of 11 standalone tool components via `NgComponentOutlet`, registered in a `TOOLS` array. `dat-honguyen.github.io` (shell): `environment.ts`/`environment.development.ts`, `app.routes.ts`, and the "My Tools" project card are updated to point at `devkit` instead of `hello-world`.

**Tech Stack:** Angular 22 (standalone components, signals, new control-flow syntax), Native Federation (`@angular-architects/native-federation`), Vitest (`@angular/build:unit-test`), native Web APIs only (`crypto.randomUUID`, `crypto.subtle.digest`, `Intl.DateTimeFormat`, `Intl.supportedValuesOf`, `TextEncoder`/`TextDecoder`) — no new npm dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-22-devkit-design.md` (this repo).
- No Angular Router inside the `devkit` remote — a `selectedId` signal on the root `App` drives which tool renders (matches this workspace's `--routing=false` convention for remotes).
- Class names follow this codebase's existing convention: no `Component`/`Service` suffix (e.g. `App`, not `AppComponent`; `GuidV4`, not `GuidV4Component`).
- Selector prefix for the `devkit` project is `dk` (was `hw` for hello-world).
- CSS var convention: DevKit CSS never *redeclares* `--color-*` custom properties (that would shadow the shell's real values when embedded). Every rule that needs a themed value uses `var(--color-x, <literal-fallback>)` inline, with the shell's exact hex values (`src/styles/abstracts/_design-tokens.scss` in the shell repo) as fallbacks. See spec section 7.
- Fallible pure functions return `Result<T>` (`{ ok: true, value: T } | { ok: false, error: string }`, from `shared/result.ts`) via the `tryResult()` helper — never throw across a component boundary, and never write to a signal from inside a `computed()` (Angular disallows/anti-patterns this).
- The "My Tools" project card in the shell keeps `status: IN_PROGRESS_STATUS` — explicit user call, not tied to whether DevKit works (see Task 2).
- `my-tools` repo has no Husky/lint-staged — run `npx prettier --write <files>` manually on changed/created files before each commit in that repo. `.prettierrc` there is prettier's defaults (2-space, single quotes, trailing commas) — do not pass repo-specific overrides.
- `dat-honguyen.github.io` repo already runs Husky + lint-staged (prettier + eslint) on commit — no manual formatting step needed there, but note its `.prettierrc` uses 4-space indent, no trailing commas (different from `my-tools`).
- No commit in either repo gets a `Co-Authored-By` trailer (explicit prior instruction for both these repos).
- Web Crypto (`crypto.subtle.digest`, `crypto.randomUUID`) and `Intl.supportedValuesOf`/`Intl.DateTimeFormat` with `timeZoneName: 'shortOffset'` were empirically confirmed to work under this project's `ng test` (Vitest + jsdom, Node 22) — no polyfills needed.

---

### Task 1: Rename `hello-world` → `devkit` (my-tools repo)

**Files:**
- Rename (git mv): `projects/hello-world` → `projects/devkit`
- Modify: `angular.json`
- Modify: `tsconfig.json`
- Modify: `projects/devkit/federation.config.mjs`
- Modify: `projects/devkit/src/main.ts`
- Modify: `projects/devkit/src/index.html`
- Modify: `projects/devkit/src/app/app.ts`
- Modify: `projects/devkit/src/app/app.html`
- Modify: `projects/devkit/src/app/app.css`
- Modify: `projects/devkit/src/app/app.spec.ts`
- Modify: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Produces: a working `devkit` Angular CLI project, buildable/testable/servable under that name, serving on port 4201 in dev (unchanged from hello-world's port), with a placeholder root component. Task 4 replaces the placeholder `App`/`app.html`/`app.css`/`app.spec.ts` entirely.

- [ ] **Step 1: Confirm the baseline passes before touching anything**

Run: `npx ng test hello-world --watch=false && npx ng build hello-world`
Expected: both PASS (this is the pre-rename baseline, not a new test).

- [ ] **Step 2: Move the project directory, preserving git history**

```bash
git mv projects/hello-world projects/devkit
```

- [ ] **Step 3: Update `angular.json`**

Replace the entire file with:

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "packageManager": "npm"
  },
  "newProjectRoot": "projects",
  "projects": {
    "devkit": {
      "projectType": "application",
      "schematics": {},
      "root": "projects/devkit",
      "sourceRoot": "projects/devkit/src",
      "prefix": "dk",
      "architect": {
        "build": {
          "builder": "@angular-architects/native-federation:build",
          "options": {
            "cacheExternalArtifacts": true
          },
          "configurations": {
            "production": {
              "target": "devkit:esbuild:production"
            },
            "development": {
              "target": "devkit:esbuild:development",
              "dev": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-architects/native-federation:build",
          "options": {
            "target": "devkit:serve-original:development",
            "rebuildDelay": 500,
            "cacheExternalArtifacts": true,
            "dev": true,
            "devServer": true,
            "port": 0
          }
        },
        "test": {
          "builder": "@angular/build:unit-test"
        },
        "esbuild": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "projects/devkit/src/main.ts",
            "tsConfig": "projects/devkit/tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "projects/devkit/public"
              }
            ],
            "styles": ["projects/devkit/src/styles.css"],
            "polyfills": ["es-module-shims"]
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
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
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "devkit:esbuild:production"
            },
            "development": {
              "buildTarget": "devkit:esbuild:development"
            }
          },
          "defaultConfiguration": "development",
          "options": {
            "port": 4201
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Update `tsconfig.json` project references**

Change:
```json
  "references": [
    {
      "path": "./projects/hello-world/tsconfig.app.json"
    },
    {
      "path": "./projects/hello-world/tsconfig.spec.json"
    }
  ]
```
To:
```json
  "references": [
    {
      "path": "./projects/devkit/tsconfig.app.json"
    },
    {
      "path": "./projects/devkit/tsconfig.spec.json"
    }
  ]
```

- [ ] **Step 5: Update `projects/devkit/federation.config.mjs`**

Replace the entire file with:

```javascript
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'devkit',

  exposes: {
    './Component': './projects/devkit/src/app/app.ts',
  },

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          // includeSecondaries is an opt-out of ignoreUnusedDeps, so all of
          // @angular/core is shared to prevent mismatches.
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

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // ignoreUnusedDeps is enabled by default now
    // ignoreUnusedDeps: true,

    // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
    denseChunking: true,
  },
});
```

- [ ] **Step 6: Update `projects/devkit/src/main.ts`**

Replace the entire file with:

```typescript
import { initFederation } from '@angular-architects/native-federation';

initFederation({ devkit: './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
```

- [ ] **Step 7: Update `projects/devkit/src/index.html`**

Replace the entire file with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>DevKit</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body>
    <dk-root></dk-root>
  </body>
</html>
```

- [ ] **Step 8: Update the placeholder root component**

`projects/devkit/src/app/app.ts`:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'dk-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

`projects/devkit/src/app/app.html`:
```html
<section class="devkit-placeholder">
  <h1>DevKit</h1>
  <p>Loading the DevKit toolkit…</p>
</section>
```

`projects/devkit/src/app/app.css`:
```css
.devkit-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 40vh;
  font-family: system-ui, sans-serif;
  text-align: center;
}
```

`projects/devkit/src/app/app.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('DevKit');
  });
});
```

(Task 4 replaces all four of these files with the real sidebar/registry architecture — this step just proves the rename works end-to-end.)

- [ ] **Step 9: Update the GitHub Actions deploy workflow**

In `.github/workflows/deploy.yml`, change:
```yaml
      PROJECTS: hello-world
```
To:
```yaml
      PROJECTS: devkit
```

- [ ] **Step 10: Update `README.md`**

Change:
```markdown
## Projects

- `hello-world` — minimal Hello World remote, exposes `./Component`.

## Commands

```bash
npm install
npx ng serve hello-world       # dev server for a given remote
npx ng build hello-world       # production build, output in dist/hello-world
npx ng test hello-world        # unit tests (Vitest)
```
```
To:
```markdown
## Projects

- `devkit` — a small suite of everyday developer utilities (GUIDs, date/time conversion, JSON, hashing, and more), exposes `./Component`.

## Commands

```bash
npm install
npx ng serve devkit       # dev server for a given remote
npx ng build devkit       # production build, output in dist/devkit
npx ng test devkit        # unit tests (Vitest)
```
```

- [ ] **Step 11: Run tests and build to verify the rename works**

Run: `npx ng test devkit --watch=false`
Expected: PASS (2 tests, both green).

Run: `npx ng build devkit`
Expected: build succeeds, output in `dist/devkit`.

Run: `grep -o '"name": *"[^"]*"' dist/devkit/browser/remoteEntry.json`
Expected: `"name": "devkit"`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Rename hello-world remote to devkit"
```

---

### Task 2: Wire the shell to `devkit` (dat-honguyen.github.io repo)

**Files:**
- Modify: `src/environments/environment.ts`
- Modify: `src/environments/environment.development.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/components/sections/projects-section/projects-section.component.ts`

**Interfaces:**
- Consumes: the `devkit` remote from Task 1 (name `devkit`, exposing `./Component`, dev server on port 4201).
- Produces: the shell resolving `/tools/devkit` to the DevKit remote, in both dev and prod.

- [ ] **Step 1: Update `src/environments/environment.ts`**

Replace the entire file with:

```typescript
export const environment = {
    production: true,
    remotes: {
        devkit: 'https://dat-honguyen.github.io/my-tools/devkit/remoteEntry.json'
    }
};
```

- [ ] **Step 2: Update `src/environments/environment.development.ts`**

Replace the entire file with:

```typescript
export const environment = {
    production: false,
    remotes: {
        devkit: 'http://localhost:4201/remoteEntry.json'
    }
};
```

- [ ] **Step 3: Update `src/app/app.routes.ts`**

Replace the entire file with:

```typescript
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ToolsPageComponent } from './pages/tools-page/tools-page.component';

export const routes: Routes = [
    { path: '', component: HomePageComponent },
    {
        path: 'tools',
        component: ToolsPageComponent,
        children: [
            {
                path: 'devkit',
                loadComponent: () =>
                    loadRemoteModule({
                        remoteName: 'devkit',
                        exposedModule: './Component'
                    }).then((m) => m.App)
            }
        ]
    }
];
```

- [ ] **Step 4: Update the "My Tools" project card**

In `src/app/components/sections/projects-section/projects-section.component.ts`, find the project entry with `slug: 'my-tools'` and replace it with:

```typescript
        {
            slug: 'devkit',
            title: 'DevKit',
            tagline: 'A shell learning to load its own crew',
            description:
                "This portfolio is also a micro-frontend shell: Angular's Native Federation lets it load independently-built, independently-deployed remotes at runtime. DevKit is the first real one — a small suite of everyday dev utilities (GUIDs, date/time conversion, JSON, hashing, and more) loaded in at runtime from a separately deployed repo.",
            tags: ['Angular', 'Native Federation', 'Micro-Frontends'],
            bg: 'linear-gradient(160deg, #0b2a24 0%, #10403a 55%, #155e54 100%)',
            status: IN_PROGRESS_STATUS,
            primaryCta: { label: 'Open DevKit', routerLink: '/tools/devkit' }
        }
```

Note: `status` stays `IN_PROGRESS_STATUS` — do not change it to `LIVE_STATUS`.

- [ ] **Step 5: Verify locally — both dev servers, cross-checked**

Terminal A (my-tools repo):
```bash
npm start
```
Expected: `Local: http://localhost:4201/`.

Terminal B (dat-honguyen.github.io repo):
```bash
npm start
```
Expected: `Local: http://localhost:4200/`.

Then:
```bash
curl -s http://localhost:4200/main.js | grep -o "localhost:4201[^\"]*\|devkit" | sort -u
```
Expected output includes both `devkit` and `localhost:4201/remoteEntry.json`.

Stop both dev servers afterward (`lsof -ti:4200,4201 | xargs -r kill -9`).

- [ ] **Step 6: Build to verify production wiring**

Run: `npm run build`
Expected: build succeeds.

Run: `grep -o "dat-honguyen.github.io/my-tools/devkit[^\"]*" dist/portfolio/browser/main-*.js`
Expected: prints the full GitHub Pages URL for the `devkit` remote entry (proves the prod environment file was picked up, not the dev one).

- [ ] **Step 7: Commit**

```bash
git add src/environments/environment.ts src/environments/environment.development.ts \
  src/app/app.routes.ts src/app/components/sections/projects-section/projects-section.component.ts
git commit -m "Wire shell to the renamed devkit remote"
```

---

### Task 3: Shared foundation — `Result` helper, global tool-panel styles, `CopyButton`

**Files:**
- Create: `projects/devkit/src/app/shared/result.ts`
- Create: `projects/devkit/src/app/shared/result.spec.ts`
- Create: `projects/devkit/src/app/shared/copy-button/copy-button.ts`
- Create: `projects/devkit/src/app/shared/copy-button/copy-button.html`
- Create: `projects/devkit/src/app/shared/copy-button/copy-button.css`
- Create: `projects/devkit/src/app/shared/copy-button/copy-button.spec.ts`
- Modify: `projects/devkit/src/styles.css`

**Interfaces:**
- Produces: `Result<T>` type + `tryResult<T>(fn: () => T): Result<T>` from `../../shared/result` (relative to a `tools/<name>/` file) — every fallible tool util wraps its parsing this way.
- Produces: `CopyButton` (selector `dk-copy-button`) from `../../shared/copy-button/copy-button`, with a required `text: string` input — every tool template uses `<dk-copy-button [text]="...">`.
- Produces: global CSS classes available to every tool template with no import needed: `.tool-panel`, `.tool-header`, `.tool-title`, `.tool-description`, `.field` (+ nested `label`/`input`/`select`/`textarea`), `.output-row`, `.output-value`, `.action-button`, `.error-text`.

- [ ] **Step 1: Write the failing test for `Result`/`tryResult`**

`projects/devkit/src/app/shared/result.spec.ts`:
```typescript
import { tryResult } from './result';

describe('tryResult', () => {
  it('wraps a successful call', () => {
    expect(tryResult(() => 42)).toEqual({ ok: true, value: 42 });
  });

  it('wraps a thrown Error', () => {
    expect(
      tryResult(() => {
        throw new Error('boom');
      }),
    ).toEqual({ ok: false, error: 'boom' });
  });

  it('wraps a thrown non-Error', () => {
    expect(
      tryResult(() => {
        throw 'nope';
      }),
    ).toEqual({ ok: false, error: 'Something went wrong.' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './result'` (or similar).

- [ ] **Step 3: Implement `Result`/`tryResult`**

`projects/devkit/src/app/shared/result.ts`:
```typescript
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function tryResult<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `CopyButton`**

`projects/devkit/src/app/shared/copy-button/copy-button.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CopyButton } from './copy-button';

describe('CopyButton', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the provided text to the clipboard', async () => {
    const fixture = TestBed.createComponent(CopyButton);
    fixture.componentRef.setInput('text', 'hello');
    fixture.detectChanges();

    await fixture.componentInstance.copy();

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('shows "Copied" then reverts after 1.5s', async () => {
    const fixture = TestBed.createComponent(CopyButton);
    fixture.componentRef.setInput('text', 'hello');
    fixture.detectChanges();

    await fixture.componentInstance.copy();
    expect(fixture.componentInstance.copied()).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.copied()).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './copy-button'` (or similar).

- [ ] **Step 7: Implement `CopyButton`**

`projects/devkit/src/app/shared/copy-button/copy-button.ts`:
```typescript
import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'dk-copy-button',
  imports: [],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
})
export class CopyButton {
  readonly text = input.required<string>();
  readonly copied = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.text());
    this.copied.set(true);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), 1500);
  }
}
```

`projects/devkit/src/app/shared/copy-button/copy-button.html`:
```html
<button type="button" class="copy-button" (click)="copy()">
  {{ copied() ? 'Copied' : 'Copy' }}
</button>
```

`projects/devkit/src/app/shared/copy-button/copy-button.css`:
```css
.copy-button {
  background: var(--color-surface, #0f172a);
  border: 1px solid var(--color-border, rgba(147, 197, 253, 0.22));
  color: var(--color-text, #f8fafc);
  padding: 0.4rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.copy-button:hover {
  border-color: var(--color-primary, #3b82f6);
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Add the shared global tool-panel styles**

Replace `projects/devkit/src/styles.css` with:

```css
* {
  box-sizing: border-box;
}

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
  color: var(--color-text, #f8fafc);
}

.tool-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #b7c6df);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.8rem;
  color: var(--color-text-muted, #b7c6df);
}

.field input,
.field select,
.field textarea {
  background: var(--color-surface, #0f172a);
  border: 1px solid var(--color-border, rgba(147, 197, 253, 0.22));
  color: var(--color-text, #f8fafc);
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
  background: var(--color-surface, #0f172a);
  border: 1px solid var(--color-border, rgba(147, 197, 253, 0.22));
  color: var(--color-text, #f8fafc);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  white-space: pre;
}

.action-button {
  align-self: flex-start;
  background: var(--color-primary, #3b82f6);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font: inherit;
  cursor: pointer;
}

.action-button:hover {
  background: var(--color-accent, #60a5fa);
}

.error-text {
  color: #f87171;
  font-size: 0.875rem;
}
```

- [ ] **Step 10: Run the full test suite to make sure nothing broke**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests, including Task 1's and Task 2's).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/shared projects/devkit/src/styles.css
git add projects/devkit/src/app/shared projects/devkit/src/styles.css
git commit -m "Add Result helper, global tool-panel styles, and CopyButton"
```

---

### Task 4: DevKit shell architecture (sidebar + detail panel + tool registry) with GUID v4 as the first tool

**Files:**
- Create: `projects/devkit/src/app/tools/guid-v4/guid-v4.ts`
- Create: `projects/devkit/src/app/tools/guid-v4/guid-v4.html`
- Create: `projects/devkit/src/app/tools/guid-v4/guid-v4.spec.ts`
- Create: `projects/devkit/src/app/tool-registry.ts`
- Modify: `projects/devkit/src/app/app.ts` (full replace)
- Modify: `projects/devkit/src/app/app.html` (full replace)
- Modify: `projects/devkit/src/app/app.css` (full replace)
- Modify: `projects/devkit/src/app/app.spec.ts` (full replace)

**Interfaces:**
- Consumes: `CopyButton` (Task 3, `../../shared/copy-button/copy-button`).
- Produces: `TOOLS: ToolDefinition[]` from `./tool-registry` (`{ id: string; label: string; component: Type<unknown> }[]`) — every later task appends one entry here. `App`'s `selectedId`/`selectedTool`/`filteredTools` signals and `selectTool`/`updateFilter` methods are the mechanism every later task's tests can rely on being present and working the same way.

- [ ] **Step 1: Write the failing test for the GUID v4 tool**

`projects/devkit/src/app/tools/guid-v4/guid-v4.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { GuidV4 } from './guid-v4';

describe('GuidV4', () => {
  it('generates a valid v4 UUID on creation', () => {
    const fixture = TestBed.createComponent(GuidV4);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when regenerate is called', () => {
    const fixture = TestBed.createComponent(GuidV4);
    fixture.detectChanges();
    const first = fixture.componentInstance.value();
    fixture.componentInstance.regenerate();
    expect(fixture.componentInstance.value()).not.toBe(first);
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './guid-v4'`.

- [ ] **Step 3: Implement the GUID v4 tool**

`projects/devkit/src/app/tools/guid-v4/guid-v4.ts`:
```typescript
import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';

@Component({
  selector: 'dk-guid-v4',
  imports: [CopyButton],
  templateUrl: './guid-v4.html',
})
export class GuidV4 {
  readonly value = signal(crypto.randomUUID());

  regenerate(): void {
    this.value.set(crypto.randomUUID());
  }
}
```

`projects/devkit/src/app/tools/guid-v4/guid-v4.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">GUID v4</h2>
    <p class="tool-description">
      A random (version 4) UUID, generated with the browser's native <code>crypto.randomUUID()</code>.
    </p>
  </header>
  <div class="output-row">
    <code class="output-value">{{ value() }}</code>
    <dk-copy-button [text]="value()"></dk-copy-button>
  </div>
  <button type="button" class="action-button" (click)="regenerate()">Generate new</button>
</section>
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the tool registry**

`projects/devkit/src/app/tool-registry.ts`:
```typescript
import { Type } from '@angular/core';
import { GuidV4 } from './tools/guid-v4/guid-v4';

export interface ToolDefinition {
  id: string;
  label: string;
  component: Type<unknown>;
}

export const TOOLS: ToolDefinition[] = [{ id: 'guid-v4', label: 'GUID v4', component: GuidV4 }];
```

- [ ] **Step 6: Write the failing test for the root `App` shell**

Replace `projects/devkit/src/app/app.spec.ts` with:
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TOOLS } from './tool-registry';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('lists every registered tool in the sidebar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.tool-item'),
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(TOOLS.map((tool) => tool.label));
  });

  it('selects the first tool by default', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe(TOOLS[0].id);
  });

  it('can select a tool by id', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.selectTool(TOOLS[0].id);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTool()?.id).toBe(TOOLS[0].id);
  });

  it('returns undefined for an unknown tool id', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.selectTool('does-not-exist');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTool()).toBeUndefined();
  });

  it('filters the tool list by label', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.updateFilter('zzz-no-match');
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredTools().length).toBe(0);
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `App` doesn't have `selectedId`/`selectTool`/etc. yet.

- [ ] **Step 8: Implement the root `App` shell**

Replace `projects/devkit/src/app/app.ts` with:
```typescript
import { Component, computed, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TOOLS } from './tool-registry';

@Component({
  selector: 'dk-root',
  imports: [NgComponentOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly tools = TOOLS;
  readonly filter = signal('');
  readonly selectedId = signal(TOOLS[0]?.id ?? '');

  readonly filteredTools = computed(() => {
    const query = this.filter().trim().toLowerCase();
    if (query === '') {
      return this.tools;
    }
    return this.tools.filter((tool) => tool.label.toLowerCase().includes(query));
  });

  readonly selectedTool = computed(() => this.tools.find((tool) => tool.id === this.selectedId()));

  selectTool(id: string): void {
    this.selectedId.set(id);
  }

  updateFilter(value: string): void {
    this.filter.set(value);
  }
}
```

Replace `projects/devkit/src/app/app.html` with:
```html
<div class="devkit">
  <aside class="sidebar">
    <input
      type="text"
      class="filter"
      placeholder="Filter tools…"
      [value]="filter()"
      (input)="updateFilter($any($event.target).value)"
    />
    <ul class="tool-list">
      @for (tool of filteredTools(); track tool.id) {
        <li>
          <button
            type="button"
            class="tool-item"
            [class.active]="tool.id === selectedId()"
            (click)="selectTool(tool.id)"
          >
            {{ tool.label }}
          </button>
        </li>
      }
    </ul>
  </aside>
  <main class="detail">
    @if (selectedTool(); as tool) {
      <ng-container [ngComponentOutlet]="tool.component"></ng-container>
    } @else {
      <p class="empty-state">Select a tool from the list.</p>
    }
  </main>
</div>
```

Replace `projects/devkit/src/app/app.css` with:
```css
:host {
  display: block;
  min-height: 100vh;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  color: var(--color-text, #f8fafc);
  background: var(--color-bg, #07111f);
}

.devkit {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border, rgba(147, 197, 253, 0.22));
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter {
  background: var(--color-surface, #0f172a);
  border: 1px solid var(--color-border, rgba(147, 197, 253, 0.22));
  color: var(--color-text, #f8fafc);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
}

.tool-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.tool-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--color-text-muted, #b7c6df);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font: inherit;
  cursor: pointer;
}

.tool-item:hover {
  background: var(--color-surface, #0f172a);
}

.tool-item.active {
  background: var(--color-surface, #0f172a);
  color: var(--color-text, #f8fafc);
  box-shadow: inset 2px 0 0 var(--color-primary, #3b82f6);
}

.detail {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.empty-state {
  color: var(--color-text-muted, #b7c6df);
}
```

- [ ] **Step 9: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests, including guid-v4's and app's).

- [ ] **Step 10: Build and manually smoke-test**

Run: `npx ng build devkit`
Expected: build succeeds.

Run: `npx ng serve devkit` (leave running), then in a browser open `http://localhost:4201/` — expect a dark sidebar with one entry "GUID v4", selected by default, showing a UUID with a working Copy button and a "Generate new" button. Stop the dev server afterward.

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app
git add projects/devkit/src/app
git commit -m "Add DevKit sidebar/detail shell with GUID v4 as the first tool"
```

---

### Task 5: GUID v7

**Files:**
- Create: `projects/devkit/src/app/tools/guid-v7/guid-v7.util.ts`
- Create: `projects/devkit/src/app/tools/guid-v7/guid-v7.util.spec.ts`
- Create: `projects/devkit/src/app/tools/guid-v7/guid-v7.ts`
- Create: `projects/devkit/src/app/tools/guid-v7/guid-v7.html`
- Create: `projects/devkit/src/app/tools/guid-v7/guid-v7.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton` (Task 3), `TOOLS`/`ToolDefinition` (Task 4).
- Produces: `generateUuidV7(): string` from `./guid-v7.util`.

- [ ] **Step 1: Write the failing test for the UUIDv7 algorithm**

`projects/devkit/src/app/tools/guid-v7/guid-v7.util.spec.ts`:
```typescript
import { generateUuidV7 } from './guid-v7.util';

describe('generateUuidV7', () => {
  it('produces a well-formed UUIDv7 string', () => {
    const uuid = generateUuidV7();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('encodes the current timestamp in the first 48 bits', () => {
    const before = Date.now();
    const uuid = generateUuidV7();
    const after = Date.now();

    const hex = uuid.replace(/-/g, '');
    const timestampMs = parseInt(hex.slice(0, 12), 16);

    expect(timestampMs).toBeGreaterThanOrEqual(before);
    expect(timestampMs).toBeLessThanOrEqual(after);
  });

  it('generates unique values across calls', () => {
    const a = generateUuidV7();
    const b = generateUuidV7();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './guid-v7.util'`.

- [ ] **Step 3: Implement the UUIDv7 algorithm (RFC 9562)**

`projects/devkit/src/app/tools/guid-v7/guid-v7.util.ts`:
```typescript
export function generateUuidV7(): string {
  const timestamp = BigInt(Date.now());
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  const bytes = new Uint8Array(16);

  // 48-bit big-endian millisecond timestamp
  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);

  // version nibble (0111) + 12 bits of randomness
  bytes[6] = 0x70 | (randomBytes[0] & 0x0f);
  bytes[7] = randomBytes[1];

  // variant bits (10) + 62 bits of randomness
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS. If the format or timestamp assertions fail, re-check the bit-shifting above against RFC 9562 §5.2 before changing anything else.

- [ ] **Step 5: Write the failing test for the GUID v7 component**

`projects/devkit/src/app/tools/guid-v7/guid-v7.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { GuidV7 } from './guid-v7';

describe('GuidV7', () => {
  it('generates a valid v7 UUID on creation', () => {
    const fixture = TestBed.createComponent(GuidV7);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when regenerate is called', () => {
    const fixture = TestBed.createComponent(GuidV7);
    fixture.detectChanges();
    const first = fixture.componentInstance.value();
    fixture.componentInstance.regenerate();
    expect(fixture.componentInstance.value()).not.toBe(first);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './guid-v7'`.

- [ ] **Step 7: Implement the GUID v7 component**

`projects/devkit/src/app/tools/guid-v7/guid-v7.ts`:
```typescript
import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { generateUuidV7 } from './guid-v7.util';

@Component({
  selector: 'dk-guid-v7',
  imports: [CopyButton],
  templateUrl: './guid-v7.html',
})
export class GuidV7 {
  readonly value = signal(generateUuidV7());

  regenerate(): void {
    this.value.set(generateUuidV7());
  }
}
```

`projects/devkit/src/app/tools/guid-v7/guid-v7.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">GUID v7</h2>
    <p class="tool-description">
      A time-ordered (version 7) UUID — sortable by creation time, per RFC 9562.
    </p>
  </header>
  <div class="output-row">
    <code class="output-value">{{ value() }}</code>
    <dk-copy-button [text]="value()"></dk-copy-button>
  </div>
  <button type="button" class="action-button" (click)="regenerate()">Generate new</button>
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and array entry:
```typescript
import { Type } from '@angular/core';
import { GuidV4 } from './tools/guid-v4/guid-v4';
import { GuidV7 } from './tools/guid-v7/guid-v7';

export interface ToolDefinition {
  id: string;
  label: string;
  component: Type<unknown>;
}

export const TOOLS: ToolDefinition[] = [
  { id: 'guid-v4', label: 'GUID v4', component: GuidV4 },
  { id: 'guid-v7', label: 'GUID v7', component: GuidV7 },
];
```

- [ ] **Step 10: Run the full suite to confirm the registry change didn't break `App`'s tests**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/guid-v7 projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/guid-v7 projects/devkit/src/app/tool-registry.ts
git commit -m "Add GUID v7 tool"
```

---

### Task 6: Date/Time Converter

**Files:**
- Create: `projects/devkit/src/app/tools/date-time-converter/date-time-converter.util.ts`
- Create: `projects/devkit/src/app/tools/date-time-converter/date-time-converter.util.spec.ts`
- Create: `projects/devkit/src/app/tools/date-time-converter/date-time-converter.ts`
- Create: `projects/devkit/src/app/tools/date-time-converter/date-time-converter.html`
- Create: `projects/devkit/src/app/tools/date-time-converter/date-time-converter.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton` (Task 3), `Result`/`tryResult` (Task 3), `TOOLS` (Task 4).
- Produces: `DateTimeConversion { iso: string; zoned: string; offset: string }` and `convertDateTime(input: string, timeZone: string): DateTimeConversion` from `./date-time-converter.util` (throws on unparseable input).

- [ ] **Step 1: Write the failing test for the conversion logic**

`projects/devkit/src/app/tools/date-time-converter/date-time-converter.util.spec.ts`:
```typescript
import { convertDateTime } from './date-time-converter.util';

describe('convertDateTime', () => {
  it('converts a known UTC instant into UTC, ISO and offset', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
    expect(result.zoned).toBe('2024-01-15T12:00:00');
    expect(result.offset).toBe('+00:00');
  });

  it('applies a named timezone offset, including half-hour zones', () => {
    const result = convertDateTime('2024-01-15T12:00:00Z', 'Asia/Kolkata');
    expect(result.zoned).toBe('2024-01-15T17:30:00');
    expect(result.offset).toBe('+05:30');
  });

  it('treats a small integer input as epoch seconds', () => {
    const result = convertDateTime('0', 'UTC');
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('treats a large integer input as epoch milliseconds', () => {
    const result = convertDateTime('1705320000000', 'UTC');
    expect(result.iso).toBe('2024-01-15T12:00:00.000Z');
  });

  it('throws on an unparseable date string', () => {
    expect(() => convertDateTime('not a date', 'UTC')).toThrow('Invalid date: not a date');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './date-time-converter.util'`.

- [ ] **Step 3: Implement the conversion logic**

`projects/devkit/src/app/tools/date-time-converter/date-time-converter.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/date-time-converter/date-time-converter.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { DateTimeConverter } from './date-time-converter';

describe('DateTimeConverter', () => {
  it('defaults to converting the current moment', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.detectChanges();
    expect(fixture.componentInstance.result().ok).toBe(true);
  });

  it('converts a pasted ISO date in the selected timezone', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.componentInstance.updateTimeZone('UTC');
    fixture.componentInstance.updateInput('2024-01-15T12:00:00Z');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.iso).toBe('2024-01-15T12:00:00.000Z');
      expect(result.value.offset).toBe('+00:00');
    }
  });

  it('surfaces an error for unparseable input', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.componentInstance.updateInput('not a date');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './date-time-converter'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/date-time-converter/date-time-converter.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { DateTimeConversion, convertDateTime } from './date-time-converter.util';

@Component({
  selector: 'dk-date-time-converter',
  imports: [CopyButton],
  templateUrl: './date-time-converter.html',
})
export class DateTimeConverter {
  readonly timeZones = Intl.supportedValuesOf('timeZone');
  readonly input = signal('');
  readonly timeZone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);

  readonly result = computed<Result<DateTimeConversion>>(() =>
    tryResult(() => convertDateTime(this.input(), this.timeZone())),
  );

  updateInput(value: string): void {
    this.input.set(value);
  }

  updateTimeZone(value: string): void {
    this.timeZone.set(value);
  }
}
```

`projects/devkit/src/app/tools/date-time-converter/date-time-converter.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Date/Time Converter</h2>
    <p class="tool-description">
      Defaults to now. Paste an ISO date or an epoch (seconds or milliseconds) to convert it.
    </p>
  </header>

  <div class="field">
    <label for="dt-input">Date, or leave blank for now</label>
    <input
      id="dt-input"
      type="text"
      placeholder="e.g. 2024-01-15T12:00:00Z or 1705320000"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    />
  </div>

  <div class="field">
    <label for="dt-timezone">Timezone</label>
    <select id="dt-timezone" [value]="timeZone()" (change)="updateTimeZone($any($event.target).value)">
      @for (zone of timeZones; track zone) {
        <option [value]="zone">{{ zone }}</option>
      }
    </select>
  </div>

  @if (result(); as r) {
    @if (r.ok) {
      <div class="output-row">
        <code class="output-value">{{ r.value.iso }}</code>
        <dk-copy-button [text]="r.value.iso"></dk-copy-button>
      </div>
      <div class="output-row">
        <code class="output-value">{{ r.value.zoned }} ({{ timeZone() }})</code>
        <dk-copy-button [text]="r.value.zoned"></dk-copy-button>
      </div>
      <div class="output-row">
        <code class="output-value">{{ r.value.offset }}</code>
        <dk-copy-button [text]="r.value.offset"></dk-copy-button>
      </div>
    } @else {
      <p class="error-text">{{ r.error }}</p>
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { DateTimeConverter } from './tools/date-time-converter/date-time-converter';
```
```typescript
  { id: 'date-time-converter', label: 'Date/Time Converter', component: DateTimeConverter },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/date-time-converter projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/date-time-converter projects/devkit/src/app/tool-registry.ts
git commit -m "Add Date/Time Converter tool"
```

---

### Task 7: Epoch/Unix Converter

**Files:**
- Create: `projects/devkit/src/app/tools/epoch-converter/epoch-converter.util.ts`
- Create: `projects/devkit/src/app/tools/epoch-converter/epoch-converter.util.spec.ts`
- Create: `projects/devkit/src/app/tools/epoch-converter/epoch-converter.ts`
- Create: `projects/devkit/src/app/tools/epoch-converter/epoch-converter.html`
- Create: `projects/devkit/src/app/tools/epoch-converter/epoch-converter.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `Result`/`tryResult`, `TOOLS`.
- Produces: `epochToDate(input: string): { utc: string; local: string }` and `dateToEpoch(input: string): { seconds: number; milliseconds: number }` from `./epoch-converter.util` (both throw on invalid input).

- [ ] **Step 1: Write the failing test for the conversion logic**

`projects/devkit/src/app/tools/epoch-converter/epoch-converter.util.spec.ts`:
```typescript
import { dateToEpoch, epochToDate } from './epoch-converter.util';

describe('epochToDate', () => {
  it('treats an 11+ digit number as milliseconds', () => {
    expect(epochToDate('1705320000000').utc).toBe('2024-01-15T12:00:00.000Z');
  });

  it('treats a 10-digit number as seconds', () => {
    expect(epochToDate('1705320000').utc).toBe('2024-01-15T12:00:00.000Z');
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

  it('rejects an unparseable date', () => {
    expect(() => dateToEpoch('not a date')).toThrow('Invalid date: not a date');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './epoch-converter.util'`.

- [ ] **Step 3: Implement the conversion logic**

`projects/devkit/src/app/tools/epoch-converter/epoch-converter.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/epoch-converter/epoch-converter.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { EpochConverter } from './epoch-converter';

describe('EpochConverter', () => {
  it('converts epoch seconds to a UTC date string', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.componentInstance.updateEpochInput('1705320000');
    fixture.detectChanges();

    const result = fixture.componentInstance.epochResult();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.utc).toBe('2024-01-15T12:00:00.000Z');
    }
  });

  it('converts a date string to epoch seconds and milliseconds', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.componentInstance.updateDateInput('2024-01-15T12:00:00Z');
    fixture.detectChanges();

    const result = fixture.componentInstance.dateResult();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.seconds).toBe(1705320000);
    }
  });

  it('defaults the date converter to now when the input is empty', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.detectChanges();
    expect(fixture.componentInstance.dateResult().ok).toBe(true);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './epoch-converter'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/epoch-converter/epoch-converter.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import {
  DateToEpochResult,
  EpochToDateResult,
  dateToEpoch,
  epochToDate,
} from './epoch-converter.util';

@Component({
  selector: 'dk-epoch-converter',
  imports: [CopyButton],
  templateUrl: './epoch-converter.html',
})
export class EpochConverter {
  readonly epochInput = signal('');
  readonly dateInput = signal('');

  readonly epochResult = computed<Result<EpochToDateResult>>(() =>
    tryResult(() => epochToDate(this.epochInput())),
  );

  readonly dateResult = computed<Result<DateToEpochResult>>(() =>
    tryResult(() => dateToEpoch(this.dateInput())),
  );

  updateEpochInput(value: string): void {
    this.epochInput.set(value);
  }

  updateDateInput(value: string): void {
    this.dateInput.set(value);
  }
}
```

`projects/devkit/src/app/tools/epoch-converter/epoch-converter.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Epoch / Unix Converter</h2>
    <p class="tool-description">Convert between Unix epoch timestamps and human-readable dates.</p>
  </header>

  <div class="field">
    <label for="epoch-input">Epoch (seconds or milliseconds)</label>
    <input
      id="epoch-input"
      type="text"
      placeholder="e.g. 1705320000"
      [value]="epochInput()"
      (input)="updateEpochInput($any($event.target).value)"
    />
  </div>
  @if (epochInput() !== '') {
    @if (epochResult(); as r) {
      @if (r.ok) {
        <div class="output-row">
          <code class="output-value">{{ r.value.utc }}</code>
          <dk-copy-button [text]="r.value.utc"></dk-copy-button>
        </div>
        <div class="output-row">
          <code class="output-value">{{ r.value.local }}</code>
          <dk-copy-button [text]="r.value.local"></dk-copy-button>
        </div>
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }

  <div class="field">
    <label for="date-input">Date, or leave blank for now</label>
    <input
      id="date-input"
      type="text"
      placeholder="e.g. 2024-01-15T12:00:00Z"
      [value]="dateInput()"
      (input)="updateDateInput($any($event.target).value)"
    />
  </div>
  @if (dateResult(); as r) {
    @if (r.ok) {
      <div class="output-row">
        <code class="output-value">{{ r.value.seconds }}</code>
        <dk-copy-button [text]="r.value.seconds.toString()"></dk-copy-button>
      </div>
      <div class="output-row">
        <code class="output-value">{{ r.value.milliseconds }}</code>
        <dk-copy-button [text]="r.value.milliseconds.toString()"></dk-copy-button>
      </div>
    } @else {
      <p class="error-text">{{ r.error }}</p>
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { EpochConverter } from './tools/epoch-converter/epoch-converter';
```
```typescript
  { id: 'epoch-converter', label: 'Epoch / Unix Converter', component: EpochConverter },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/epoch-converter projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/epoch-converter projects/devkit/src/app/tool-registry.ts
git commit -m "Add Epoch/Unix Converter tool"
```

---

### Task 8: JSON Formatter/Validator

**Files:**
- Create: `projects/devkit/src/app/tools/json-formatter/json-formatter.util.ts`
- Create: `projects/devkit/src/app/tools/json-formatter/json-formatter.util.spec.ts`
- Create: `projects/devkit/src/app/tools/json-formatter/json-formatter.ts`
- Create: `projects/devkit/src/app/tools/json-formatter/json-formatter.html`
- Create: `projects/devkit/src/app/tools/json-formatter/json-formatter.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `Result`/`tryResult`, `TOOLS`.
- Produces: `formatJson(input: string, mode: 'pretty' | 'minify'): string` from `./json-formatter.util` (throws `SyntaxError` on invalid JSON).

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/json-formatter/json-formatter.util.spec.ts`:
```typescript
import { formatJson } from './json-formatter.util';

describe('formatJson', () => {
  it('pretty-prints with 2-space indentation', () => {
    expect(formatJson('{"a":1,"b":[1,2]}', 'pretty')).toBe(
      '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}',
    );
  });

  it('minifies whitespace', () => {
    expect(formatJson('{\n  "a": 1\n}', 'minify')).toBe('{"a":1}');
  });

  it('throws on invalid JSON', () => {
    expect(() => formatJson('{not json}', 'pretty')).toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './json-formatter.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/json-formatter/json-formatter.util.ts`:
```typescript
export function formatJson(input: string, mode: 'pretty' | 'minify'): string {
  const parsed: unknown = JSON.parse(input);
  return mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/json-formatter/json-formatter.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { JsonFormatter } from './json-formatter';

describe('JsonFormatter', () => {
  it('pretty-prints valid JSON by default', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{"a":1}');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{\n  "a": 1\n}');
    }
  });

  it('minifies when minify mode is selected', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{ "a": 1 }');
    fixture.componentInstance.setMode('minify');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{"a":1}');
    }
  });

  it('surfaces a validation error for malformed JSON', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{not json}');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './json-formatter'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/json-formatter/json-formatter.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { formatJson } from './json-formatter.util';

@Component({
  selector: 'dk-json-formatter',
  imports: [CopyButton],
  templateUrl: './json-formatter.html',
})
export class JsonFormatter {
  readonly input = signal('');
  readonly mode = signal<'pretty' | 'minify'>('pretty');

  readonly result = computed<Result<string>>(() =>
    tryResult(() => formatJson(this.input(), this.mode())),
  );

  updateInput(value: string): void {
    this.input.set(value);
  }

  setMode(mode: 'pretty' | 'minify'): void {
    this.mode.set(mode);
  }
}
```

`projects/devkit/src/app/tools/json-formatter/json-formatter.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">JSON Formatter/Validator</h2>
    <p class="tool-description">Paste JSON to pretty-print, minify, or validate it.</p>
  </header>

  <div class="field">
    <label for="json-input">JSON input</label>
    <textarea
      id="json-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  <div class="output-row">
    <button type="button" class="action-button" (click)="setMode('pretty')">Pretty-print</button>
    <button type="button" class="action-button" (click)="setMode('minify')">Minify</button>
  </div>

  @if (input() !== '') {
    @if (result(); as r) {
      @if (r.ok) {
        <div class="output-row">
          <code class="output-value">{{ r.value }}</code>
          <dk-copy-button [text]="r.value"></dk-copy-button>
        </div>
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { JsonFormatter } from './tools/json-formatter/json-formatter';
```
```typescript
  { id: 'json-formatter', label: 'JSON Formatter/Validator', component: JsonFormatter },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/json-formatter projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/json-formatter projects/devkit/src/app/tool-registry.ts
git commit -m "Add JSON Formatter/Validator tool"
```

---

### Task 9: Base64 Encode/Decode

**Files:**
- Create: `projects/devkit/src/app/tools/base64-tool/base64-tool.util.ts`
- Create: `projects/devkit/src/app/tools/base64-tool/base64-tool.util.spec.ts`
- Create: `projects/devkit/src/app/tools/base64-tool/base64-tool.ts`
- Create: `projects/devkit/src/app/tools/base64-tool/base64-tool.html`
- Create: `projects/devkit/src/app/tools/base64-tool/base64-tool.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `Result`/`tryResult`, `TOOLS`.
- Produces: `encodeBase64(input: string): string` and `decodeBase64(input: string): string` from `./base64-tool.util` (UTF-8 safe; `decodeBase64` throws on invalid Base64 or invalid UTF-8).

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/base64-tool/base64-tool.util.spec.ts`:
```typescript
import { decodeBase64, encodeBase64 } from './base64-tool.util';

describe('encodeBase64', () => {
  it('encodes plain ASCII text', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
  });
});

describe('decodeBase64', () => {
  it('decodes back to the original text', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
  });

  it('round-trips UTF-8 text including multi-byte characters', () => {
    const original = 'héllo 👋';
    expect(decodeBase64(encodeBase64(original))).toBe(original);
  });

  it('throws on invalid Base64', () => {
    expect(() => decodeBase64('not base64!!!')).toThrow('That is not valid Base64.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './base64-tool.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/base64-tool/base64-tool.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/base64-tool/base64-tool.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { Base64Tool } from './base64-tool';

describe('Base64Tool', () => {
  it('encodes text by default', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.updateInput('hello');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('aGVsbG8=');
    }
  });

  it('decodes Base64 when direction is set to decode', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('aGVsbG8=');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('hello');
    }
  });

  it('surfaces an error for invalid Base64', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('not base64!!!');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './base64-tool'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/base64-tool/base64-tool.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

@Component({
  selector: 'dk-base64-tool',
  imports: [CopyButton],
  templateUrl: './base64-tool.html',
})
export class Base64Tool {
  readonly direction = signal<'encode' | 'decode'>('encode');
  readonly input = signal('');

  readonly result = computed<Result<string>>(() =>
    tryResult(() =>
      this.direction() === 'encode' ? encodeBase64(this.input()) : decodeBase64(this.input()),
    ),
  );

  setDirection(direction: 'encode' | 'decode'): void {
    this.direction.set(direction);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }
}
```

`projects/devkit/src/app/tools/base64-tool/base64-tool.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Base64 Encode/Decode</h2>
    <p class="tool-description">Convert text to and from Base64, safely handling UTF-8.</p>
  </header>

  <div class="output-row">
    <button type="button" class="action-button" (click)="setDirection('encode')">Encode</button>
    <button type="button" class="action-button" (click)="setDirection('decode')">Decode</button>
  </div>

  <div class="field">
    <label for="base64-input">{{ direction() === 'encode' ? 'Text' : 'Base64' }}</label>
    <textarea
      id="base64-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  @if (input() !== '') {
    @if (result(); as r) {
      @if (r.ok) {
        <div class="output-row">
          <code class="output-value">{{ r.value }}</code>
          <dk-copy-button [text]="r.value"></dk-copy-button>
        </div>
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { Base64Tool } from './tools/base64-tool/base64-tool';
```
```typescript
  { id: 'base64-tool', label: 'Base64 Encode/Decode', component: Base64Tool },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/base64-tool projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/base64-tool projects/devkit/src/app/tool-registry.ts
git commit -m "Add Base64 Encode/Decode tool"
```

---

### Task 10: JWT Decoder

**Files:**
- Create: `projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.util.ts`
- Create: `projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.util.spec.ts`
- Create: `projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.ts`
- Create: `projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.html`
- Create: `projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `Result`/`tryResult`, `TOOLS`.
- Produces: `DecodedJwt { header: unknown; payload: unknown }` and `decodeJwt(token: string): DecodedJwt` from `./jwt-decoder.util` (throws on malformed tokens; does not verify the signature).

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.util.spec.ts`:
```typescript
import { decodeJwt } from './jwt-decoder.util';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('decodeJwt', () => {
  it('decodes the header and payload of a well-known sample JWT', () => {
    const decoded = decodeJwt(SAMPLE_JWT);
    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
  });

  it('throws when the token has fewer than two parts', () => {
    expect(() => decodeJwt('not-a-jwt')).toThrow(
      'That does not look like a JWT (expected at least two dot-separated parts).',
    );
  });

  it('throws when a segment is not valid base64url JSON', () => {
    expect(() => decodeJwt('!!!.!!!')).toThrow('Could not decode the JWT header.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './jwt-decoder.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { JwtDecoder } from './jwt-decoder';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('JwtDecoder', () => {
  it('decodes a valid JWT into header and payload', () => {
    const fixture = TestBed.createComponent(JwtDecoder);
    fixture.componentInstance.updateInput(SAMPLE_JWT);
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    }
  });

  it('surfaces an error for malformed input', () => {
    const fixture = TestBed.createComponent(JwtDecoder);
    fixture.componentInstance.updateInput('not-a-jwt');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './jwt-decoder'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { DecodedJwt, decodeJwt } from './jwt-decoder.util';

@Component({
  selector: 'dk-jwt-decoder',
  imports: [CopyButton],
  templateUrl: './jwt-decoder.html',
})
export class JwtDecoder {
  readonly input = signal('');

  readonly result = computed<Result<DecodedJwt>>(() => tryResult(() => decodeJwt(this.input())));

  updateInput(value: string): void {
    this.input.set(value);
  }

  format(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
```

`projects/devkit/src/app/tools/jwt-decoder/jwt-decoder.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">JWT Decoder</h2>
    <p class="tool-description">Decodes a JWT's header and payload. Signature is not verified.</p>
  </header>

  <div class="field">
    <label for="jwt-input">JWT</label>
    <textarea
      id="jwt-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  @if (input() !== '') {
    @if (result(); as r) {
      @if (r.ok) {
        <div class="field">
          <label>Header</label>
          <div class="output-row">
            <code class="output-value">{{ format(r.value.header) }}</code>
            <dk-copy-button [text]="format(r.value.header)"></dk-copy-button>
          </div>
        </div>
        <div class="field">
          <label>Payload</label>
          <div class="output-row">
            <code class="output-value">{{ format(r.value.payload) }}</code>
            <dk-copy-button [text]="format(r.value.payload)"></dk-copy-button>
          </div>
        </div>
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { JwtDecoder } from './tools/jwt-decoder/jwt-decoder';
```
```typescript
  { id: 'jwt-decoder', label: 'JWT Decoder', component: JwtDecoder },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/jwt-decoder projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/jwt-decoder projects/devkit/src/app/tool-registry.ts
git commit -m "Add JWT Decoder tool"
```

---

### Task 11: Hash Generator (MD5, SHA-1, SHA-256)

**Files:**
- Create: `projects/devkit/src/app/tools/hash-generator/md5.ts`
- Create: `projects/devkit/src/app/tools/hash-generator/md5.spec.ts`
- Create: `projects/devkit/src/app/tools/hash-generator/hash-generator.util.ts`
- Create: `projects/devkit/src/app/tools/hash-generator/hash-generator.util.spec.ts`
- Create: `projects/devkit/src/app/tools/hash-generator/hash-generator.ts`
- Create: `projects/devkit/src/app/tools/hash-generator/hash-generator.html`
- Create: `projects/devkit/src/app/tools/hash-generator/hash-generator.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `TOOLS`. (Not `Result`/`tryResult` — hashing has no failure mode besides empty input, handled directly.)
- Produces: `md5(input: string): string` from `./md5`; `sha(algorithm: 'SHA-1' | 'SHA-256', input: string): Promise<string>` from `./hash-generator.util`.

- [ ] **Step 1: Write the failing test for MD5**

`projects/devkit/src/app/tools/hash-generator/md5.spec.ts`:
```typescript
import { md5 } from './md5';

describe('md5', () => {
  it('matches the known digest of the empty string', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('matches the known digest of "abc"', () => {
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('matches the known digest of a longer pangram', () => {
    expect(md5('The quick brown fox jumps over the lazy dog')).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './md5'`.

- [ ] **Step 3: Implement MD5**

`projects/devkit/src/app/tools/hash-generator/md5.ts`:
```typescript
const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10,
  15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS. If any digest doesn't match, re-check the per-round `f`/`g` formulas and the shift/constant tables above against RFC 1321 before changing the surrounding code — this is a direct transcription and the bug (if any) will be a transcription slip in those tables.

- [ ] **Step 5: Write the failing test for the SHA helper**

`projects/devkit/src/app/tools/hash-generator/hash-generator.util.spec.ts`:
```typescript
import { sha } from './hash-generator.util';

describe('sha', () => {
  it('computes a known SHA-256 digest', async () => {
    expect(await sha('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('computes a known SHA-1 digest', async () => {
    expect(await sha('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './hash-generator.util'`.

- [ ] **Step 7: Implement the SHA helper**

`projects/devkit/src/app/tools/hash-generator/hash-generator.util.ts`:
```typescript
export async function sha(algorithm: 'SHA-1' | 'SHA-256', input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Write the failing test for the component**

`projects/devkit/src/app/tools/hash-generator/hash-generator.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { HashGenerator } from './hash-generator';

describe('HashGenerator', () => {
  it('computes md5, sha1 and sha256 for the given text', async () => {
    const fixture = TestBed.createComponent(HashGenerator);
    await fixture.componentInstance.updateInput('abc');
    fixture.detectChanges();

    const hashes = fixture.componentInstance.hashes();
    expect(hashes).not.toBeNull();
    expect(hashes?.md5).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(hashes?.sha1).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(hashes?.sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('clears hashes when input is emptied', async () => {
    const fixture = TestBed.createComponent(HashGenerator);
    await fixture.componentInstance.updateInput('abc');
    await fixture.componentInstance.updateInput('');
    fixture.detectChanges();

    expect(fixture.componentInstance.hashes()).toBeNull();
  });
});
```

- [ ] **Step 10: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './hash-generator'`.

- [ ] **Step 11: Implement the component**

`projects/devkit/src/app/tools/hash-generator/hash-generator.ts`:
```typescript
import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { sha } from './hash-generator.util';
import { md5 } from './md5';

interface Hashes {
  md5: string;
  sha1: string;
  sha256: string;
}

@Component({
  selector: 'dk-hash-generator',
  imports: [CopyButton],
  templateUrl: './hash-generator.html',
})
export class HashGenerator {
  readonly input = signal('');
  readonly hashes = signal<Hashes | null>(null);

  async updateInput(value: string): Promise<void> {
    this.input.set(value);
    if (value === '') {
      this.hashes.set(null);
      return;
    }
    const [sha1, sha256] = await Promise.all([sha('SHA-1', value), sha('SHA-256', value)]);
    this.hashes.set({ md5: md5(value), sha1, sha256 });
  }
}
```

`projects/devkit/src/app/tools/hash-generator/hash-generator.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Hash Generator</h2>
    <p class="tool-description">MD5, SHA-1, and SHA-256 digests of the text below.</p>
  </header>

  <div class="field">
    <label for="hash-input">Text</label>
    <textarea
      id="hash-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  @if (hashes(); as h) {
    <div class="field">
      <label>MD5</label>
      <div class="output-row">
        <code class="output-value">{{ h.md5 }}</code>
        <dk-copy-button [text]="h.md5"></dk-copy-button>
      </div>
    </div>
    <div class="field">
      <label>SHA-1</label>
      <div class="output-row">
        <code class="output-value">{{ h.sha1 }}</code>
        <dk-copy-button [text]="h.sha1"></dk-copy-button>
      </div>
    </div>
    <div class="field">
      <label>SHA-256</label>
      <div class="output-row">
        <code class="output-value">{{ h.sha256 }}</code>
        <dk-copy-button [text]="h.sha256"></dk-copy-button>
      </div>
    </div>
  }
</section>
```

- [ ] **Step 12: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 13: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { HashGenerator } from './tools/hash-generator/hash-generator';
```
```typescript
  { id: 'hash-generator', label: 'Hash Generator', component: HashGenerator },
```

- [ ] **Step 14: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 15: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/hash-generator projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/hash-generator projects/devkit/src/app/tool-registry.ts
git commit -m "Add Hash Generator tool"
```

---

### Task 12: URL Encode/Decode

**Files:**
- Create: `projects/devkit/src/app/tools/url-codec/url-codec.util.ts`
- Create: `projects/devkit/src/app/tools/url-codec/url-codec.util.spec.ts`
- Create: `projects/devkit/src/app/tools/url-codec/url-codec.ts`
- Create: `projects/devkit/src/app/tools/url-codec/url-codec.html`
- Create: `projects/devkit/src/app/tools/url-codec/url-codec.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `Result`/`tryResult`, `TOOLS`.
- Produces: `encodeUrl(input: string): string` and `decodeUrl(input: string): string` from `./url-codec.util` (`decodeUrl` throws on malformed percent-encoding).

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/url-codec/url-codec.util.spec.ts`:
```typescript
import { decodeUrl, encodeUrl } from './url-codec.util';

describe('encodeUrl', () => {
  it('percent-encodes reserved characters', () => {
    expect(encodeUrl('a b/c?d=e&f')).toBe('a%20b%2Fc%3Fd%3De%26f');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoded text', () => {
    expect(decodeUrl('a%20b%2Fc%3Fd%3De%26f')).toBe('a b/c?d=e&f');
  });

  it('throws on malformed percent-encoding', () => {
    expect(() => decodeUrl('%')).toThrow('That is not validly percent-encoded.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './url-codec.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/url-codec/url-codec.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/url-codec/url-codec.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { UrlCodec } from './url-codec';

describe('UrlCodec', () => {
  it('encodes text by default', () => {
    const fixture = TestBed.createComponent(UrlCodec);
    fixture.componentInstance.updateInput('a b');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('a%20b');
    }
  });

  it('decodes when direction is set to decode', () => {
    const fixture = TestBed.createComponent(UrlCodec);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('a%20b');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('a b');
    }
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './url-codec'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/url-codec/url-codec.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { decodeUrl, encodeUrl } from './url-codec.util';

@Component({
  selector: 'dk-url-codec',
  imports: [CopyButton],
  templateUrl: './url-codec.html',
})
export class UrlCodec {
  readonly direction = signal<'encode' | 'decode'>('encode');
  readonly input = signal('');

  readonly result = computed<Result<string>>(() =>
    tryResult(() =>
      this.direction() === 'encode' ? encodeUrl(this.input()) : decodeUrl(this.input()),
    ),
  );

  setDirection(direction: 'encode' | 'decode'): void {
    this.direction.set(direction);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }
}
```

`projects/devkit/src/app/tools/url-codec/url-codec.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">URL Encode/Decode</h2>
    <p class="tool-description">Percent-encode or decode text for use in a URL.</p>
  </header>

  <div class="output-row">
    <button type="button" class="action-button" (click)="setDirection('encode')">Encode</button>
    <button type="button" class="action-button" (click)="setDirection('decode')">Decode</button>
  </div>

  <div class="field">
    <label for="url-input">Text</label>
    <textarea
      id="url-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  @if (input() !== '') {
    @if (result(); as r) {
      @if (r.ok) {
        <div class="output-row">
          <code class="output-value">{{ r.value }}</code>
          <dk-copy-button [text]="r.value"></dk-copy-button>
        </div>
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { UrlCodec } from './tools/url-codec/url-codec';
```
```typescript
  { id: 'url-codec', label: 'URL Encode/Decode', component: UrlCodec },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/url-codec projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/url-codec projects/devkit/src/app/tool-registry.ts
git commit -m "Add URL Encode/Decode tool"
```

---

### Task 13: Case Converter

**Files:**
- Create: `projects/devkit/src/app/tools/case-converter/case-converter.util.ts`
- Create: `projects/devkit/src/app/tools/case-converter/case-converter.util.spec.ts`
- Create: `projects/devkit/src/app/tools/case-converter/case-converter.ts`
- Create: `projects/devkit/src/app/tools/case-converter/case-converter.html`
- Create: `projects/devkit/src/app/tools/case-converter/case-converter.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `CopyButton`, `TOOLS`. (No `Result` needed — these functions never throw.)
- Produces: `toCamelCase`, `toPascalCase`, `toSnakeCase`, `toKebabCase` (all `(input: string) => string`) from `./case-converter.util`.

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/case-converter/case-converter.util.spec.ts`:
```typescript
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

describe('case converter', () => {
  it('converts a space-separated phrase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toPascalCase('hello world')).toBe('HelloWorld');
    expect(toSnakeCase('hello world')).toBe('hello_world');
    expect(toKebabCase('hello world')).toBe('hello-world');
  });

  it('converts an existing camelCase phrase', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });

  it('converts a mixed snake/kebab phrase', () => {
    expect(toCamelCase('some_mixed-input case')).toBe('someMixedInputCase');
  });

  it('returns an empty string for empty input', () => {
    expect(toCamelCase('')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './case-converter.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/case-converter/case-converter.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/case-converter/case-converter.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { CaseConverter } from './case-converter';

describe('CaseConverter', () => {
  it('converts input into all four cases', () => {
    const fixture = TestBed.createComponent(CaseConverter);
    fixture.componentInstance.updateInput('hello world');
    fixture.detectChanges();

    expect(fixture.componentInstance.camelCase()).toBe('helloWorld');
    expect(fixture.componentInstance.pascalCase()).toBe('HelloWorld');
    expect(fixture.componentInstance.snakeCase()).toBe('hello_world');
    expect(fixture.componentInstance.kebabCase()).toBe('hello-world');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './case-converter'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/case-converter/case-converter.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

@Component({
  selector: 'dk-case-converter',
  imports: [CopyButton],
  templateUrl: './case-converter.html',
})
export class CaseConverter {
  readonly input = signal('');

  readonly camelCase = computed(() => toCamelCase(this.input()));
  readonly pascalCase = computed(() => toPascalCase(this.input()));
  readonly snakeCase = computed(() => toSnakeCase(this.input()));
  readonly kebabCase = computed(() => toKebabCase(this.input()));

  updateInput(value: string): void {
    this.input.set(value);
  }
}
```

`projects/devkit/src/app/tools/case-converter/case-converter.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Case Converter</h2>
    <p class="tool-description">
      Convert text between camelCase, PascalCase, snake_case, and kebab-case.
    </p>
  </header>

  <div class="field">
    <label for="case-input">Text</label>
    <input
      id="case-input"
      type="text"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    />
  </div>

  @if (input() !== '') {
    <div class="output-row">
      <code class="output-value">{{ camelCase() }}</code>
      <dk-copy-button [text]="camelCase()"></dk-copy-button>
    </div>
    <div class="output-row">
      <code class="output-value">{{ pascalCase() }}</code>
      <dk-copy-button [text]="pascalCase()"></dk-copy-button>
    </div>
    <div class="output-row">
      <code class="output-value">{{ snakeCase() }}</code>
      <dk-copy-button [text]="snakeCase()"></dk-copy-button>
    </div>
    <div class="output-row">
      <code class="output-value">{{ kebabCase() }}</code>
      <dk-copy-button [text]="kebabCase()"></dk-copy-button>
    </div>
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { CaseConverter } from './tools/case-converter/case-converter';
```
```typescript
  { id: 'case-converter', label: 'Case Converter', component: CaseConverter },
```

- [ ] **Step 10: Run the full suite**

Run: `npx ng test devkit --watch=false`
Expected: PASS (all tests).

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/case-converter projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/case-converter projects/devkit/src/app/tool-registry.ts
git commit -m "Add Case Converter tool"
```

---

### Task 14: Regex Tester

**Files:**
- Create: `projects/devkit/src/app/tools/regex-tester/regex-tester.util.ts`
- Create: `projects/devkit/src/app/tools/regex-tester/regex-tester.util.spec.ts`
- Create: `projects/devkit/src/app/tools/regex-tester/regex-tester.ts`
- Create: `projects/devkit/src/app/tools/regex-tester/regex-tester.html`
- Create: `projects/devkit/src/app/tools/regex-tester/regex-tester.spec.ts`
- Modify: `projects/devkit/src/app/tool-registry.ts`

**Interfaces:**
- Consumes: `Result`/`tryResult`, `TOOLS`. (No `CopyButton` — output here is a match count/replacement preview, not a single copyable value.)
- Produces: `RegexMatch { match: string; index: number }`, `RegexTestResult { matches: RegexMatch[]; replaced?: string }`, and `testRegex(pattern: string, flags: string, input: string, replacement?: string): RegexTestResult` from `./regex-tester.util` (throws on an invalid pattern).

- [ ] **Step 1: Write the failing test**

`projects/devkit/src/app/tools/regex-tester/regex-tester.util.spec.ts`:
```typescript
import { testRegex } from './regex-tester.util';

describe('testRegex', () => {
  it('finds all matches with their indices', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333');
    expect(result.matches).toEqual([
      { match: '1', index: 1 },
      { match: '22', index: 4 },
      { match: '333', index: 8 },
    ]);
  });

  it('replaces matches when a replacement is provided', () => {
    const result = testRegex('\\d+', '', 'a1 b22 c333', 'NUM');
    expect(result.replaced).toBe('aNUM bNUM cNUM');
  });

  it('is case-insensitive with the i flag', () => {
    const result = testRegex('abc', 'i', 'ABC abc');
    expect(result.matches).toHaveLength(2);
  });

  it('throws a clear error for an invalid pattern', () => {
    expect(() => testRegex('(', '', 'anything')).toThrow();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './regex-tester.util'`.

- [ ] **Step 3: Implement**

`projects/devkit/src/app/tools/regex-tester/regex-tester.util.ts`:
```typescript
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

- [ ] **Step 4: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the component**

`projects/devkit/src/app/tools/regex-tester/regex-tester.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { RegexTester } from './regex-tester';

describe('RegexTester', () => {
  it('reports matches for a valid pattern', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('\\d+');
    fixture.componentInstance.updateInput('a1 b22');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.matches).toHaveLength(2);
    }
  });

  it('replaces matches once a replacement is entered', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('\\d+');
    fixture.componentInstance.updateInput('a1 b22');
    fixture.componentInstance.updateReplacement('NUM');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.replaced).toBe('aNUM bNUM');
    }
  });

  it('surfaces an error for an invalid pattern', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('(');
    fixture.componentInstance.updateInput('anything');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx ng test devkit --watch=false`
Expected: FAIL — `Cannot find module './regex-tester'`.

- [ ] **Step 7: Implement the component**

`projects/devkit/src/app/tools/regex-tester/regex-tester.ts`:
```typescript
import { Component, computed, signal } from '@angular/core';
import { Result, tryResult } from '../../shared/result';
import { RegexTestResult, testRegex } from './regex-tester.util';

@Component({
  selector: 'dk-regex-tester',
  imports: [],
  templateUrl: './regex-tester.html',
})
export class RegexTester {
  readonly pattern = signal('');
  readonly flags = signal('');
  readonly input = signal('');
  readonly replacement = signal('');
  readonly useReplacement = signal(false);

  readonly result = computed<Result<RegexTestResult>>(() =>
    tryResult(() =>
      testRegex(
        this.pattern(),
        this.flags(),
        this.input(),
        this.useReplacement() ? this.replacement() : undefined,
      ),
    ),
  );

  updatePattern(value: string): void {
    this.pattern.set(value);
  }

  updateFlags(value: string): void {
    this.flags.set(value);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }

  updateReplacement(value: string): void {
    this.replacement.set(value);
    this.useReplacement.set(true);
  }
}
```

`projects/devkit/src/app/tools/regex-tester/regex-tester.html`:
```html
<section class="tool-panel">
  <header class="tool-header">
    <h2 class="tool-title">Regex Tester</h2>
    <p class="tool-description">
      Test a regular expression against a string, with optional replacement.
    </p>
  </header>

  <div class="field">
    <label for="regex-pattern">Pattern</label>
    <input
      id="regex-pattern"
      type="text"
      placeholder="e.g. \d+"
      [value]="pattern()"
      (input)="updatePattern($any($event.target).value)"
    />
  </div>

  <div class="field">
    <label for="regex-flags">Flags</label>
    <input
      id="regex-flags"
      type="text"
      placeholder="e.g. gi"
      [value]="flags()"
      (input)="updateFlags($any($event.target).value)"
    />
  </div>

  <div class="field">
    <label for="regex-input">Test string</label>
    <textarea
      id="regex-input"
      [value]="input()"
      (input)="updateInput($any($event.target).value)"
    ></textarea>
  </div>

  <div class="field">
    <label for="regex-replacement">Replacement (optional)</label>
    <input
      id="regex-replacement"
      type="text"
      [value]="replacement()"
      (input)="updateReplacement($any($event.target).value)"
    />
  </div>

  @if (pattern() !== '') {
    @if (result(); as r) {
      @if (r.ok) {
        <p class="tool-description">{{ r.value.matches.length }} match(es)</p>
        @if (r.value.replaced !== undefined) {
          <div class="output-row">
            <code class="output-value">{{ r.value.replaced }}</code>
          </div>
        }
      } @else {
        <p class="error-text">{{ r.error }}</p>
      }
    }
  }
</section>
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx ng test devkit --watch=false`
Expected: PASS.

- [ ] **Step 9: Register the tool**

In `projects/devkit/src/app/tool-registry.ts`, add the import and append to `TOOLS`:
```typescript
import { RegexTester } from './tools/regex-tester/regex-tester';
```
```typescript
  { id: 'regex-tester', label: 'Regex Tester', component: RegexTester },
```

- [ ] **Step 10: Run the full suite — all 11 tools, final check**

Run: `npx ng test devkit --watch=false`
Expected: PASS (every spec file across shared/, tool-registry consumers, and all 11 tools).

Run: `npx ng build devkit`
Expected: build succeeds.

- [ ] **Step 11: Format and commit**

```bash
npx prettier --write projects/devkit/src/app/tools/regex-tester projects/devkit/src/app/tool-registry.ts
git add projects/devkit/src/app/tools/regex-tester projects/devkit/src/app/tool-registry.ts
git commit -m "Add Regex Tester tool"
```

---

## After all 14 tasks

- Push both repos (`my-tools` first, since the shell's prod environment URL points at it; then `dat-honguyen.github.io`).
- `my-tools`'s GitHub Actions workflow auto-deploys `devkit` to GitHub Pages on push to `main`.
- The shell repo needs a manual `npm run deploy` (`wrangler deploy`) — not automatic — to publish the updated routes/environment/project-card to `datisa.dev`.
- Do a real click-through afterward: `datisa.dev` → Tools card → "Open DevKit" → confirm the sidebar lists all 11 tools, each one renders and its copy buttons work.
