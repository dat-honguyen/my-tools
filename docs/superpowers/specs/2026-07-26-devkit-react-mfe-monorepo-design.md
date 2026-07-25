# DevKit → React MFE + Coming-Soon Angular Remote — Hybrid Monorepo Design

## Context

`my-tools` currently hosts a single Angular CLI project (`projects/devkit`) built with
`@angular-architects/native-federation`, exposing `./Component` and deployed to GitHub Pages.
The shell (`../portfolio`, a separate Angular repo) loads it via `loadRemoteModule` and renders
the exposed Angular component directly.

Goals of this change:

1. Rebuild DevKit as a **React** app (a deliberate experiment — the user's primary stack is
   Angular, this is exploration), keeping all 11 existing tools and porting the visual style of
   a pasted terminal-themed mockup (`projects/devkit/gemini-code-1784999663975.html`) into the
   existing sidebar + detail-panel layout (not a literal command-line REPL).
2. Add a second, brand-new **Angular** remote — a "Coming Soon" placeholder for a future project
   — as practice with the same Native Federation pattern already used for `devkit`.
3. Turn `my-tools` into a **hybrid monorepo** that can build/serve multiple independent remotes
   (of different frameworks) from one repo, instead of one remote per repo.
4. Wire both remotes into the `../portfolio` shell, which stays Angular and may be modified as
   needed (new wrapper component, routes, env config, project card, CI).

## 1. Repo layout — Nx monorepo

`my-tools` converts from a single-project Angular CLI workspace into an **Nx monorepo** (npm
workspaces, one shared `node_modules`, no `@nx/angular`/`@nx/react` plugins — Nx here is purely a
task runner/cache over each app's own build tooling):

```
my-tools/
  nx.json
  package.json              # workspaces: ["apps/*"], root devDeps (nx, typescript, prettier…)
  tsconfig.base.json
  apps/
    devkit/                 # React remote (rebuilt from projects/devkit)
      project.json           # nx targets: build, serve, test → run-commands calling esbuild scripts
      federation.config.js
      build/build.ts
      src/
        main.ts, bootstrap.tsx, register.tsx, App.tsx
        tools/…              # ported 1:1 from projects/devkit/src/app/tools
        shared/…
    coming-soon/             # Angular remote (new)
      project.json           # nx targets: build, serve, test → @angular-architects/native-federation:build (same as today)
      federation.config.mjs
      src/…
  .github/workflows/deploy.yml   # updated to build both apps
```

`projects/devkit` (Angular) and root `angular.json` are removed once the port is verified working
side by side (see plan for staging). `nx.json` defines `targetDefaults` for `build`/`test` caching;
each app's `project.json` is hand-written, not generated, since neither app needs an Nx framework
plugin — they just wrap the same builders/scripts these projects would use standalone.

## 2. `apps/devkit` — React remote

Modeled directly on the official reference (`manfredsteyer/native-federation-react-example`),
which demonstrates Native Federation's core (`@softarc/native-federation`) used framework- and
bundler-agnostically with plain esbuild — no Vite/Rsbuild/webpack.

**Dependencies:** `react`, `react-dom`, `@softarc/native-federation`,
`@softarc/native-federation-esbuild`, `esbuild`, `typescript`.

**Build (`apps/devkit/build/build.ts`, run via `tsx`/compiled and invoked by the Nx `build`
target):**
```ts
await federationBuilder.init({
  options: { workspaceRoot, outputPath: 'dist/devkit', tsConfig: 'tsconfig.json',
             federationConfig: 'apps/devkit/federation.config.js' },
  adapter: createEsBuildAdapter({ plugins: [] }),
});
await esbuild.build({
  entryPoints: ['apps/devkit/src/main.ts'],
  external: federationBuilder.externals,
  outdir: 'dist/devkit', bundle: true, platform: 'browser', format: 'esm', splitting: true,
});
await federationBuilder.build();
```
A `serve` target runs the same build in watch mode plus a static file server (`live-server` or
`esbuild`'s own serve) for local iteration against the shell.

**`federation.config.js`:**
```js
module.exports = withNativeFederation({
  name: 'devkit',
  exposes: { './Component': './apps/devkit/src/register.tsx' },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
});
```

**Web Component boundary (`src/register.tsx`)** — the one file responsible for the
React↔Angular boundary:
```tsx
class DevkitElement extends HTMLElement {
  private root?: Root;
  connectedCallback() { this.root = createRoot(this); this.root.render(<App />); }
  disconnectedCallback() { this.root?.unmount(); }
}
if (!customElements.get('dk-devkit-app')) {
  customElements.define('dk-devkit-app', DevkitElement);
}
```
Loading this exposed module registers the custom element as a side effect. The Angular shell
never touches React APIs — it just needs the tag to exist once the remote module has loaded.

**App structure & UI** — direct port of the current Angular app's shape:
- `App.tsx`: sidebar (filterable tool list, `useState` filter + derived list) + detail panel
  showing the selected tool, same interaction model as today's `App`/`app.html`.
- `tool-registry.ts`: same `{ id, label, component }[]` shape, React components instead of
  Angular `Type<unknown>`.
- Each of the 11 tools (`guid-v4`, `guid-v7`, `date-time-converter`, `epoch-converter`,
  `json-formatter`, `base64-tool`, `jwt-decoder`, `hash-generator`, `url-codec`,
  `case-converter`, `regex-tester`) ports to a `ToolName.tsx` + reuses the existing
  `*.util.ts` pure functions almost unchanged (they're framework-agnostic already) +
  `*.util.spec.ts` becomes `*.util.test.ts` (Vitest, no DOM needed for these).
- Shared `CopyButton` ports to a React component with the same copy-to-clipboard behavior
  (`shared/result.ts` helpers reused as-is).
- Visual design: adopt the terminal look from the pasted mockup as the **theme**, not a literal
  REPL — dark slate background (`#0f172a`)/panel (`#1e293b`), monospace font stack
  (`'Fira Code', 'Consolas', 'Monaco', monospace`), terminal window chrome (traffic-light dots +
  centered title bar) wrapping the whole `<dk-devkit-app>`, and the mockup's status palette
  (`--prompt-color` green / `--error-color` red / `--system-color` blue / `--highlight` amber)
  reused consistently as success/error/info/warning colors across all 11 tools.

## 3. `apps/coming-soon` — Angular remote (new)

Same pattern as `devkit` uses today, copied rather than reinvented:
- Angular CLI-style `project.json` targets using `@angular-architects/native-federation:build`
  for `build`/`serve`, `@angular/build:application` for the underlying esbuild target — identical
  builder chain to the current `devkit` Angular project, just re-hosted under Nx's `project.json`
  instead of root `angular.json`.
- `federation.config.mjs`: `name: 'coming-soon'`, `exposes: { './Component': './apps/coming-soon/src/app/app.ts' }`.
- Single placeholder component/page: "Coming Soon" theme — dark gradient background, project name
  placeholder, short teaser copy, no functional tools. Visually distinct from devkit's terminal
  theme (this is a different future project, not devkit).

## 4. Shell changes (`../portfolio`)

- **New generic wrapper component** (e.g. `RemoteWebComponentHost`) for hosting non-Angular
  remotes: on init, calls `loadRemoteModule({ remoteName, exposedModule })` (which registers the
  custom element as a side effect), then creates and appends the target tag
  (`document.createElement('dk-devkit-app')`) into a local container — avoiding the need for
  `CUSTOM_ELEMENTS_SCHEMA` on the whole routed component tree.
- **`app.routes.ts`**: `tools/devkit` switches from
  `loadComponent: () => loadRemoteModule(...).then(m => m.App)` (assumed an Angular component) to
  routing through `RemoteWebComponentHost` configured for `{ remoteName: 'devkit', exposedModule:
  './Component', tagName: 'dk-devkit-app' }`. New `tools/coming-soon` child route added, using the
  existing direct `loadComponent(...).then(m => m.App)` pattern since that remote is Angular.
- **`environment.ts` / `environment.development.ts`**: add `comingSoon` remote URL entries
  alongside `devkit` (prod: GitHub Pages `/my-tools/coming-soon/remoteEntry.json`; dev:
  `http://localhost:4202/remoteEntry.json`, the new app's dev port).
- **`projects-section.component.ts`**: add a new `Project` entry for the Coming Soon placeholder,
  introducing a new `PLANNED_STATUS` (distinct from `LIVE_STATUS`/`IN_PROGRESS_STATUS` — no
  functionality exists yet, so "in progress" would overstate it), `routerLink:
  '/tools/coming-soon'`.

## 5. Build/deploy

- `my-tools/.github/workflows/deploy.yml`: `PROJECTS` env var becomes framework-aware — Angular
  apps still build via `npx nx build <app>` → `@angular-architects/native-federation:build`
  output; the React app builds via `npx nx build devkit` → the esbuild script. Both publish to
  `public/<app>` under the same GitHub Pages structure as today
  (`/my-tools/devkit/remoteEntry.json`, `/my-tools/coming-soon/remoteEntry.json`).
- `../portfolio` deploy (Cloudflare Workers via `wrangler`) is unaffected structurally — only the
  route/env/component changes above.

## Out of scope

- No changes to `../portfolio`'s visual design system beyond the new project card and the
  federation wiring above.
- No Nx framework plugins (`@nx/angular`, `@nx/react`) — this stays a thin Nx layer over
  hand-written targets.
- No SSR for the React remote.
