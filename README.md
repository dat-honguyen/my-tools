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
npx nx build devkit       # production build, output in dist/devkit
npx nx test devkit        # unit tests (Vitest)

npx nx serve coming-soon  # same, for the Angular coming-soon remote
npx nx build coming-soon
npx nx test coming-soon

npx nx run-many -t build  # build every project
npx nx run-many -t test   # test every project
```

## Adding a new MFE

- **React remote** (like `devkit`): scaffold a new `apps/<name>` with its own `project.json`, `package.json`, esbuild-based `build/build.ts`, and `federation.config.mjs` (Native Federation via `@softarc/native-federation` + `@softarc/native-federation-esbuild`); expose a root component from `./Component` and register it as a Web Component tag consumed by the shell.
- **Angular remote** (like `coming-soon`): `npx ng generate application <name> --routing=false`, then `npx ng add @angular-architects/native-federation --project <name> --type remote`, then add an Nx `project.json` for it under `apps/<name>`.

For either kind:
1. Add `<name>` to the `PROJECTS` list in `.github/workflows/deploy.yml`.
2. Wire it up in the shell: add the remote's URL to its federation config and a route in `app.routes.ts`.
