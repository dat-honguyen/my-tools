import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { convertDateTime } from './date-time-converter.util';

const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export function DateTimeConverter() {
  const [input, setInput] = useState('');
  const [timeZone, setTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const result = useMemo(() => tryResult(() => convertDateTime(input, timeZone)), [input, timeZone]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Date/Time Converter</h2>
        <p className="tool-description">
          Defaults to now. Paste an ISO date or an epoch (seconds or milliseconds) to convert it.
        </p>
      </header>

      <div className="field">
        <label htmlFor="dt-input">Date, or leave blank for now</label>
        <input
          id="dt-input"
          type="text"
          placeholder="e.g. 2024-01-15T12:00:00Z or 1705320000"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="dt-timezone">Timezone</label>
        <select id="dt-timezone" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
          {TIME_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      {result.ok ? (
        <>
          <div className="output-row">
            <code className="output-value">{result.value.iso}</code>
            <CopyButton text={result.value.iso} />
          </div>
          <div className="output-row">
            <code className="output-value">
              {result.value.zoned} ({timeZone})
            </code>
            <CopyButton text={result.value.zoned} />
          </div>
          <div className="output-row">
            <code className="output-value">{result.value.offset}</code>
            <CopyButton text={result.value.offset} />
          </div>
        </>
      ) : (
        <p className="error-text">{result.error}</p>
      )}
    </section>
  );
}
