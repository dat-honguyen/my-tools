import { createRoot, type Root } from 'react-dom/client';
// `tsconfig.json`'s `"jsx": "react-jsx"` makes every `.tsx` file emit a
// bare `react/jsx-runtime` import that never appears as literal source
// text, so native-federation's static usage scan (which walks source
// imports, not the JSX-compiled output) treats it as unused and drops it
// from `shared` — see `federation.config.js`. This explicit side-effect
// import makes the dependency visible so it's actually shared/externalized
// and gets an import-map entry (verified via `dist/devkit/importmap.json`).
import 'react/jsx-runtime';
import './styles/theme.css';
import './styles/tool-panel.css';
import { App } from './App';

class DevkitElement extends HTMLElement {
  private root?: Root;

  connectedCallback(): void {
    this.root = createRoot(this);
    this.root.render(<App />);
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
