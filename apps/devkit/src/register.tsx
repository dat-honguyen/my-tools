import { createRoot, type Root } from 'react-dom/client';
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
