import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { generateUuidV7 } from './guid-v7.util';

export function GuidV7() {
  const [value, setValue] = useState(generateUuidV7);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">GUID v7</h2>
        <p className="tool-description">A time-sortable (version 7) UUID.</p>
      </header>
      <div className="output-row">
        <code className="output-value">{value}</code>
        <CopyButton text={value} />
      </div>
      <button type="button" className="action-button" onClick={() => setValue(generateUuidV7())}>
        Generate new
      </button>
    </section>
  );
}
