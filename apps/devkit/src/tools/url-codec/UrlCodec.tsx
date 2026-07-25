import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeUrl, encodeUrl } from './url-codec.util';

export function UrlCodec() {
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');

  const result = useMemo(
    () => tryResult(() => (direction === 'encode' ? encodeUrl(input) : decodeUrl(input))),
    [direction, input],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">URL Encode/Decode</h2>
        <p className="tool-description">Percent-encode or decode text for use in a URL.</p>
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
        <label htmlFor="url-input">Text</label>
        <textarea id="url-input" value={input} onChange={(e) => setInput(e.target.value)} />
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
