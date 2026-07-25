const { withNativeFederation, shareAll } = require('@softarc/native-federation/config');

module.exports = withNativeFederation({
  name: 'devkit',

  exposes: {
    // Brief's literal text used a repo-root-relative path
    // ('./apps/devkit/src/register.tsx'). Changed to project-relative
    // ('./src/register.tsx') to pair with build.ts's `workspaceRoot:
    // path.join(__dirname, '..')` (apps/devkit), instead of the brief's
    // `../../..` (repo root). Both `workspaceRoot` and this path must agree
    // on which directory paths are resolved relative to; this pairing is
    // self-consistent and verified functional via `npx nx build devkit`.
    './Component': './src/register.tsx',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
    // shareAll() only shares packages listed in package.json dependencies;
    // esbuild's automatic JSX runtime emits a bare `react/jsx-runtime` import
    // that isn't a dependency name by itself, so it must be shared explicitly
    // or it's left as an unresolvable external with no import-map entry.
    'react/jsx-runtime': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    },
  },
});
