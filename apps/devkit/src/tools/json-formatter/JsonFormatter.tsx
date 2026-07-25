import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { formatJson } from './json-formatter.util';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'pretty' | 'minify'>('pretty');

  const result = useMemo(() => tryResult(() => formatJson(input, mode)), [input, mode]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">JSON Formatter/Validator</h2>
        <p className="tool-description">Paste JSON to pretty-print, minify, or validate it.</p>
      </header>

      <div className="field">
        <label htmlFor="json-input">JSON input</label>
        <textarea id="json-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="output-row">
        <button type="button" className="action-button" onClick={() => setMode('pretty')}>
          Pretty-print
        </button>
        <button type="button" className="action-button" onClick={() => setMode('minify')}>
          Minify
        </button>
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
