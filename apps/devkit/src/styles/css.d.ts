// `build.ts` uses esbuild's `text` loader for `.css` files (see the
// comment in `register.tsx`), so a `.css` import's default export is the
// raw stylesheet source as a string — not a CSS module class map. This
// replaces the ambient `declare module '*.css' {}` that used to come
// from `"types": ["vite/client"]` (removed from tsconfig.json since no
// Vite bundler is used here).
declare module '*.css' {
  const content: string;
  export default content;
}
