import { describe, expect, it, vi } from 'vitest';
import './register';

describe('register', () => {
  it('defines the dk-devkit-app custom element', () => {
    expect(customElements.get('dk-devkit-app')).toBeDefined();
  });

  it('mounts and unmounts without throwing', async () => {
    const el = document.createElement('dk-devkit-app');
    document.body.appendChild(el);
    // `register.tsx` renders into a shadow root (not `el` directly) so the
    // injected stylesheet stays scoped to this element — see register.tsx.
    // `Element.textContent` does not traverse the shadow boundary, so
    // assert against `shadowRoot.textContent` instead.
    await vi.waitFor(() => {
      expect(el.shadowRoot?.textContent).toContain('datisa.dev - Universal DevKit');
    });
    el.remove();
  });
});
