import React from 'react';
import ReactDOMClient, { type Root } from 'react-dom/client';
import theme from './styles/theme.css';
import terminal from './styles/terminal.css';
import { Terminal } from './Terminal';

// Destructured off the default import rather than a named import — see the
// comment in federation.config.js on why named imports of this
// federation-shared package don't work in production builds.
const { createRoot } = ReactDOMClient;

class DevkitElement extends HTMLElement {
  private root?: Root;

  connectedCallback() {
    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `${theme}\n${terminal}`;
    shadow.appendChild(style);

    const container = document.createElement('div');
    shadow.appendChild(container);

    this.root = createRoot(container);
    this.root.render(<Terminal />);
  }

  disconnectedCallback() {
    this.root?.unmount();
  }
}

if (!customElements.get('dk-devkit-app')) {
  customElements.define('dk-devkit-app', DevkitElement);
}
