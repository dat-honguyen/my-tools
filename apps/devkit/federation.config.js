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

  // Named imports of federation-shared packages are unreliable here:
  // native-federation-esbuild's CJS-export synthesis for "browser-shared"
  // node_modules bundles emits a guard that's supposed to populate each
  // named binding from the real required module, but under production
  // (minified) builds that guard's backing object never actually gets
  // populated for react / react-dom / react-dom/client / react/jsx-runtime
  // — every named export silently resolves to `undefined` at runtime, while
  // the `default` export (a namespace object) always has real values.
  // Rather than work around that per-package, `jsx: 'react'` in
  // tsconfig.json switches off the automatic JSX runtime (which auto-injects
  // a named `{ jsx, jsxs }` import from 'react/jsx-runtime') in favor of the
  // classic `React.createElement` transform, and our own source now imports
  // React/ReactDOM as default imports and destructures off of that — so
  // 'react/jsx-runtime' is no longer used anywhere and doesn't need sharing.
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
