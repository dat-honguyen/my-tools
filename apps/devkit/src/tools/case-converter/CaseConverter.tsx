import { useState } from 'react';
import { CopyButton } from '../../shared/CopyButton';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

export function CaseConverter() {
  const [input, setInput] = useState('');

  return (
    <section className="tool-panel">
      <header className="tool-header">
        <h2 className="tool-title">Case Converter</h2>
        <p className="tool-description">
          Convert text between camelCase, PascalCase, snake_case, and kebab-case.
        </p>
      </header>

      <div className="field">
        <label htmlFor="case-input">Text</label>
        <input id="case-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {input !== '' && (
        <>
          <div className="output-row">
            <code className="output-value">{toCamelCase(input)}</code>
            <CopyButton text={toCamelCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toPascalCase(input)}</code>
            <CopyButton text={toPascalCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toSnakeCase(input)}</code>
            <CopyButton text={toSnakeCase(input)} />
          </div>
          <div className="output-row">
            <code className="output-value">{toKebabCase(input)}</code>
            <CopyButton text={toKebabCase(input)} />
          </div>
        </>
      )}
    </section>
  );
}
