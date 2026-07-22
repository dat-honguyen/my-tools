# my-tools

Angular multi-project workspace hosting a collection of Native Federation micro-frontends, consumed by the [portfolio shell](https://github.com/dat-honguyen/portfolio) at `dat-honguyen.github.io`.

Each project under `projects/` is an independent Native Federation remote, built and deployed to GitHub Pages under its own subpath (e.g. `https://dat-honguyen.github.io/my-tools/devkit/`).

## Projects

- `devkit` — a small suite of everyday developer utilities (GUIDs, date/time conversion, JSON, hashing, and more), exposes `./Component`.

## Commands

```bash
npm install
npx ng serve devkit       # dev server for a given remote
npx ng build devkit       # production build, output in dist/devkit
npx ng test devkit        # unit tests (Vitest)
```

## Adding a new MFE

1. `npx ng generate application <name> --routing=false`
2. `npx ng add @angular-architects/native-federation --project <name> --type remote`
3. Add `<name>` to the `PROJECTS` list in `.github/workflows/deploy.yml`
4. Wire it up in the shell: add the remote's URL to `federation.config.js` and a route in `app.routes.ts`
