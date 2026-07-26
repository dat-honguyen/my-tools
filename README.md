# my-tools

Hybrid Nx monorepo hosting a collection of Native Federation micro-frontends, consumed by the [portfolio shell](https://github.com/dat-honguyen/portfolio) at `dat-honguyen.github.io`.

Each project under `apps/` is an independent Native Federation remote, built and deployed to GitHub Pages under its own subpath (e.g. `https://dat-honguyen.github.io/my-tools/devkit/`).

## Projects

- `apps/devkit` — a small suite of everyday developer utilities (GUIDs, date/time conversion, JSON, hashing, and more), built with React + esbuild, exposes `./Component` as a Web Component (`dk-devkit-app`).
- `apps/coming-soon` — an Angular Native Federation remote used as a placeholder for routes not yet implemented in the shell.

## Commands

```bash
npm install
npx nx serve devkit       # dev server for a given remote
npx nx build devkit       # production build, output in apps/devkit/dist/devkit
npx nx test devkit        # unit tests (Vitest)

npx nx serve coming-soon  # same, for the Angular coming-soon remote
npx nx build coming-soon
npx nx test coming-soon

npx nx run-many -t build  # build every project
npx nx run-many -t test   # test every project
```

## Adding a new MFE

- **React remote** (like `devkit`): scaffold a new `apps/<name>` with its own `project.json`, `package.json`, esbuild-based `build/build.ts`, and `federation.config.js` (Native Federation via `@softarc/native-federation` + `@softarc/native-federation-esbuild`); expose a root component from `./Component` and register it as a Web Component tag consumed by the shell.
- **Angular remote** (like `coming-soon`): there's no `@nx/angular` plugin wired into this workspace and `angular.json` no longer exists, so `npx ng generate application` won't work here. Instead, manually scaffold `apps/<name>` following `apps/coming-soon`'s layout: an Angular app (`src/main.ts`, `src/bootstrap.ts`, `src/app/`, `tsconfig.app.json`, `tsconfig.spec.json`) plus an Nx `project.json` modeled on `apps/coming-soon/project.json`, wiring the `@angular-architects/native-federation:build`/`serve` executors and an `@angular/build:application` target with a `federation.config.mjs`.

For either kind:
1. Add `<name>` to the `PROJECTS` list in `.github/workflows/deploy.yml`.
2. Wire it up in the shell: add the remote's URL to its federation config and a route in `app.routes.ts`.
