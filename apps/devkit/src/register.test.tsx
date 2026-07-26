import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import './register';

describe('dk-devkit-app custom element', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('registers the dk-devkit-app custom element', () => {
    expect(customElements.get('dk-devkit-app')).toBeDefined();
  });

  it('renders the Terminal into its shadow root when connected', async () => {
    const el = document.createElement('dk-devkit-app');
    document.body.appendChild(el);
    await waitFor(() => {
      expect(el.shadowRoot?.textContent).toContain('datisa.dev - Universal DevKit');
    });
  });
});
