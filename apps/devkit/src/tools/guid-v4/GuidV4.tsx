import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';

export function GuidV4() {
  const [value, setValue] = useState(() => crypto.randomUUID());

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">GUID v4</h2>
        <p className="tool-description">
          A random (version 4) UUID, generated with the browser&apos;s native{' '}
          <code>crypto.randomUUID()</code>.
        </p>
      </header>
      <div className="output-row">
        <code className="output-value">{value}</code>
        <CopyButton text={value} />
      </div>
      <button type="button" className="action-button" onClick={() => setValue(crypto.randomUUID())}>
        Generate new
      </button>
    </section>
  );
}
