import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { decodeJwt } from './jwt-decoder.util';

function format(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const result = useMemo(() => tryResult(() => decodeJwt(input)), [input]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">JWT Decoder</h2>
        <p className="tool-description">Decodes a JWT&apos;s header and payload. Signature is not verified.</p>
      </header>

      <div className="field">
        <label htmlFor="jwt-input">JWT</label>
        <textarea id="jwt-input" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' &&
        (result.ok ? (
          <>
            <div className="field">
              <label>Header</label>
              <div className="output-row">
                <code className="output-value">{format(result.value.header)}</code>
                <CopyButton text={format(result.value.header)} />
              </div>
            </div>
            <div className="field">
              <label>Payload</label>
              <div className="output-row">
                <code className="output-value">{format(result.value.payload)}</code>
                <CopyButton text={format(result.value.payload)} />
              </div>
            </div>
          </>
        ) : (
          <p className="error-text">{result.error}</p>
        ))}
    </section>
  );
}
