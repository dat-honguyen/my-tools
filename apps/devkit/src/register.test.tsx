import { describe, expect, it, vi } from 'vitest';
import './register';

describe('register', () => {
  it('defines the dk-devkit-app custom element', () => {
    expect(customElements.get('dk-devkit-app')).toBeDefined();
  });

  it('mounts and unmounts without throwing', async () => {
    const el = document.createElement('dk-devkit-app');
    document.body.appendChild(el);
    await vi.waitFor(() => {
      expect(el.textContent).toContain('datisa.dev - Universal DevKit');
    });
    el.remove();
  });
});
