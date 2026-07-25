import { useMemo, useState } from 'react';
import { tryResult } from '../../shared/result';
import { testRegex } from './regex-tester.util';

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('');
  const [input, setInput] = useState('');
  const [replacement, setReplacement] = useState('');
  const [useReplacement, setUseReplacement] = useState(false);

  const result = useMemo(
    () =>
      tryResult(() => testRegex(pattern, flags, input, useReplacement ? replacement : undefined)),
    [pattern, flags, input, useReplacement, replacement],
  );

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Regex Tester</h2>
        <p className="tool-description">Test a regular expression against a string, with optional replacement.</p>
      </header>

      <div className="field">
        <label htmlFor="regex-pattern">Pattern</label>
        <input
          id="regex-pattern"
          type="text"
          placeholder="e.g. \d+"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="regex-flags">Flags</label>
        <input
          id="regex-flags"
          type="text"
          placeholder="e.g. gi"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="regex-input">Test string</label>
        <textarea id="regex-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="regex-replacement">Replacement (optional)</label>
        <input
          id="regex-replacement"
          type="text"
          value={replacement}
          onChange={(e) => {
            setReplacement(e.target.value);
            setUseReplacement(true);
          }}
        />
      </div>

      {pattern !== '' &&
        (result.ok ? (
          <>
            <p className="tool-description">{result.value.matches.length} match(es)</p>
            {result.value.replaced !== undefined && (
              <div className="output-row">
                <code className="output-value">{result.value.replaced}</code>
              </div>
            )}
          </>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
