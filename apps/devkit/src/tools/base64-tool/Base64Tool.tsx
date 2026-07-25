import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

export function Base64Tool() {
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  const result = useMemo(
    () => tryResult(() => (direction === 'encode' ? encodeBase64(input) : decodeBase64(input))),
    [direction, input],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Base64 Encode/Decode</h2>
        <p className="tool-description">Convert text to and from Base64, safely handling UTF-8.</p>
      </header>

      <div className="output-row">
        <button type="button" className="action-button" onClick={() => setDirection('encode')}>
          Encode
        </button>
        <button type="button" className="action-button" onClick={() => setDirection('decode')}>
          Decode
        </button>
      </div>

      <div className="field">
        <label htmlFor="base64-input">{direction === 'encode' ? 'Text' : 'Base64'}</label>
        <textarea id="base64-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' &&
        (result.ok ? (
          <div className="output-row">
            <code className="output-value">{result.value}</code>
            <CopyButton text={result.value} />
          </div>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
