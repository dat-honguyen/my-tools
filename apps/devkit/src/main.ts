// The brief's original snippet called `initFederation()` from
// `@softarc/native-federation`, but that runtime API does not exist in the
// installed `@softarc/native-federation@4.3.2` (it is build-tooling only —
// see its `.`/`./config`/`./domain`/`./internal`/`./internal/browser`
// exports, none of which expose an `initFederation` function). The runtime
// API historically lived in `@softarc/native-federation-runtime`, and its
// successor `@softarc/native-federation-orchestrator` — but both mark
// `initFederation` itself as end-of-life in their own JSDoc, so pulling in
// either package for this standalone dev shell isn't a solid long-term bet.
//
// Instead, replicate the one thing this standalone shell actually needs:
// resolve the bare `react` / `react-dom` / `react-dom/client` /
// `react/jsx-runtime` specifiers that esbuild leaves external (see
// `federation.config.js`'s `shared` map and `build.ts`'s
// `external: federationBuilder.externals`). `build.ts` already writes
// `importmap.json` next to `main.js` via `federationBuilder.build()`, so we
// just inject it as a native `<script type="importmap">` before importing
// anything that needs it. This mirrors exactly what `initFederation()`'s own
// docs say it does under the hood ("creates an ES module import map ...
// injects it into the DOM").
async function injectImportMap(): Promise<void> {
  const res = await fetch('./importmap.json');
  const importMap = await res.json();
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify(importMap);
  document.head.appendChild(script);
}

(async () => {
  await injectImportMap();
  await import('./bootstrap');
})();
