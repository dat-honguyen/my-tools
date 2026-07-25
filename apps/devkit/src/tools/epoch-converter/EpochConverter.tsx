import { useMemo, useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { tryResult } from '../../shared/result';
import { dateToEpoch, epochToDate } from './epoch-converter.util';

export function EpochConverter() {
  const [epochInput, setEpochInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const epochResult = useMemo(() => tryResult(() => epochToDate(epochInput)), [epochInput]);
  const dateResult = useMemo(() => tryResult(() => dateToEpoch(dateInput)), [dateInput]);

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Epoch / Unix Converter</h2>
        <p className="tool-description">Convert between Unix epoch timestamps and human-readable dates.</p>
      </header>

      <div className="field">
        <label htmlFor="epoch-input">Epoch (seconds or milliseconds)</label>
        <input
          id="epoch-input"
          type="text"
          placeholder="e.g. 1705320000"
          value={epochInput}
          onChange={(e) => setEpochInput(e.target.value)}
        />
      </div>
      {epochInput !== '' &&
        (epochResult.ok ? (
          <>
            <div className="output-row">
              <code className="output-value">{epochResult.value.utc}</code>
              <CopyButton text={epochResult.value.utc} />
            </div>
            <div className="output-row">
              <code className="output-value">{epochResult.value.local}</code>
              <CopyButton text={epochResult.value.local} />
            </div>
          </>
        ) : (
          <p className="error-text">{epochResult.error}</p>
        ))}

      <div className="field">
        <label htmlFor="date-input">Date, or leave blank for now</label>
        <input
          id="date-input"
          type="text"
          placeholder="e.g. 2024-01-15T12:00:00Z"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
        />
      </div>
      {dateResult.ok ? (
        <>
          <div className="output-row">
            <code className="output-value">{dateResult.value.seconds}</code>
            <CopyButton text={String(dateResult.value.seconds)} />
          </div>
          <div className="output-row">
            <code className="output-value">{dateResult.value.milliseconds}</code>
            <CopyButton text={String(dateResult.value.milliseconds)} />
          </div>
        </>
      ) : (
        <p className="error-text">{dateResult.error}</p>
      )}
    </section>
  );
}
