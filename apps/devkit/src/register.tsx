import { createRoot, type Root } from 'react-dom/client';
// `tsconfig.json`'s `"jsx": "react-jsx"` makes every `.tsx` file emit a
// bare `react/jsx-runtime` import that never appears as literal source
// text, so native-federation's static usage scan (which walks source
// imports, not the JSX-compiled output) treats it as unused and drops it
// from `shared` — see `federation.config.js`. This explicit side-effect
// import makes the dependency visible so it's actually shared/externalized
// and gets an import-map entry (verified via `dist/devkit/importmap.json`).
import 'react/jsx-runtime';
// `build.ts` uses esbuild's `text` loader for `.css` (see the comment
// there for why: the `css` loader emits sibling `.css` files but injects
// no `<link>`/`<style>` reference anywhere, so nothing ever loads them).
// Importing the raw text lets us inject it ourselves as a `<style>`
// element inside this element's shadow root below.
import theme from './styles/theme.css';
import terminal from './styles/terminal.css';
import { Terminal } from './Terminal';

class DevkitElement extends HTMLElement {
  private root?: Root;

  connectedCallback(): void {
    // Render into a shadow root (rather than `this` directly) so the
    // injected stylesheet's `:root`/`*`/custom-property rules are scoped
    // to this element instead of leaking onto — or colliding with — the
    // host page's own identically-named design tokens (see theme.css).
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `${theme}\n${terminal}`;
    shadow.appendChild(style);

    const container = document.createElement('div');
    shadow.appendChild(container);

    this.root = createRoot(container);
    this.root.render(<Terminal />);
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
  }
}

if (!customElements.get('dk-devkit-app')) {
  customElements.define('dk-devkit-app', DevkitElement);
}

export {};
