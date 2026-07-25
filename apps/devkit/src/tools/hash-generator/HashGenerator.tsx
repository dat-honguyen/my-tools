import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { sha } from './hash-generator.util';
import { md5 } from './md5';

interface Hashes {
  md5: string;
  sha1: string;
  sha256: string;
}

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Hashes | null>(null);

  async function updateInput(value: string) {
    setInput(value);
    if (value === '') {
      setHashes(null);
      return;
    }
    const [sha1, sha256] = await Promise.all([sha('SHA-1', value), sha('SHA-256', value)]);
    setHashes({ md5: md5(value), sha1, sha256 });
  }

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Hash Generator</h2>
        <p className="tool-description">MD5, SHA-1, and SHA-256 digests of the text below.</p>
      </header>

      <div className="field">
        <label htmlFor="hash-input">Text</label>
        <textarea id="hash-input" value={input} onChange={(e) => updateInput(e.target.value)} />
      </div>

      {hashes && (
        <>
          <div className="field">
            <label>MD5</label>
            <div className="output-row">
              <code className="output-value">{hashes.md5}</code>
              <CopyButton text={hashes.md5} />
            </div>
          </div>
          <div className="field">
            <label>SHA-1</label>
            <div className="output-row">
              <code className="output-value">{hashes.sha1}</code>
              <CopyButton text={hashes.sha1} />
            </div>
          </div>
          <div className="field">
            <label>SHA-256</label>
            <div className="output-row">
              <code className="output-value">{hashes.sha256}</code>
              <CopyButton text={hashes.sha256} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
