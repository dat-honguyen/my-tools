# my-tools

Angular multi-project workspace hosting a collection of Native Federation micro-frontends, consumed by the [portfolio shell](https://github.com/dat-honguyen/portfolio) at `dat-honguyen.github.io`.

Each project under `projects/` is an independent Native Federation remote, built and deployed to GitHub Pages under its own subpath (e.g. `https://dat-honguyen.github.io/my-tools/hello-world/`).

## Projects

- `hello-world` — minimal Hello World remote, exposes `./Component`.

## Commands

```bash
npm install
npx ng serve hello-world       # dev server for a given remote
npx ng build hello-world       # production build, output in dist/hello-world
npx ng test hello-world        # unit tests (Vitest)
```

## Adding a new MFE

1. `npx ng generate application <name> --routing=false`
2. `npx ng add @angular-architects/native-federation --project <name> --type remote`
3. Add `<name>` to the `PROJECTS` list in `.github/workflows/deploy.yml`
4. Wire it up in the shell: add the remote's URL to `federation.config.js` and a route in `app.routes.ts`
