import { createRoot, type Root } from 'react-dom/client';
import theme from './styles/theme.css';
import terminal from './styles/terminal.css';
import { Terminal } from './Terminal';

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
