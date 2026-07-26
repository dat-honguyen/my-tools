import React from 'react';
// Destructured off the default import rather than named imports — see the
// comment in federation.config.js on why named imports of this
// federation-shared package don't work in production builds.
const { useEffect, useRef, useState } = React;
import { COMMANDS } from './commands';
import { executeCommand } from './commands/execute-command';
import { getCompletionCandidates, getSuggestion } from './commands/get-suggestion';
import { highlightInput } from './commands/highlight-input';
import type { CommandResult } from './commands/types';
import { copyToClipboard } from './shared/clipboard';

const HISTORY_KEY = 'devkit:history';
const HISTORY_LIMIT = 50;
const PROMPT = 'datisa@devkit:~$';

type OutputLine = CommandResult | { text: string; kind: 'echo' | 'warning' | 'confirm' };

function renderHighlighted(text: string, highlights: [number, number][] | undefined) {
  if (!highlights || highlights.length === 0) return text;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  highlights.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark key={i} className="output-highlight">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function Terminal() {
  const [output, setOutput] = useState<OutputLine[]>([
    { text: 'Welcome to DevKit v1.0.0', kind: 'system' },
    { text: 'Type help to see a list of available commands.', kind: 'system' },
  ]);
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  function appendOutput(line: OutputLine) {
    setOutput((prev) => [...prev, line]);
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function navigateHistory(direction: 1 | -1) {
    if (history.length === 0) return;
    const nextIndex =
      direction === -1
        ? historyIndex === null
          ? history.length - 1
          : Math.max(0, historyIndex - 1)
        : historyIndex === null
          ? null
          : historyIndex + 1;

    if (nextIndex === null || nextIndex >= history.length) {
      setHistoryIndex(null);
      setValue('');
      return;
    }
    setHistoryIndex(nextIndex);
    setValue(history[nextIndex]);
  }

  async function submit(raw: string) {
    const trimmed = raw.trim();
    appendOutput({ text: `${PROMPT} ${raw}`, kind: 'echo' });
    setValue('');
    setHistoryIndex(null);

    if (trimmed !== '') {
      const nextHistory =
        history[history.length - 1] === trimmed ? history : [...history, trimmed].slice(-HISTORY_LIMIT);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    }

    if (trimmed === '') return;

    if (trimmed === 'clear') {
      setOutput([]);
      return;
    }

    if (trimmed === 'help') {
      appendOutput({ text: 'Available commands:', kind: 'system' });
      for (const spec of COMMANDS) {
        const args = spec.args.map((arg) => (arg.optional ? `[${arg.name}]` : `<${arg.name}>`)).join(' ');
        appendOutput({ text: `  ${spec.id}${args ? ` ${args}` : ''} — ${spec.summary}`, kind: 'warning' });
      }
      appendOutput({ text: '  clear — Clear the terminal output', kind: 'warning' });
      return;
    }

    const { output: results, copyText } = await executeCommand(trimmed, COMMANDS);
    for (const line of results) appendOutput(line);

    if (copyText !== undefined) {
      const copied = await copyToClipboard(copyText);
      appendOutput(
        copied
          ? { text: '✓ Copied to clipboard!', kind: 'confirm' }
          : { text: 'Failed to copy to clipboard. Permission denied.', kind: 'error' },
      );
    }
  }

  const suggestion = getSuggestion(value, history, COMMANDS);
  const inputSegments = highlightInput(value, COMMANDS);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      if (suggestion) {
        setValue(value + suggestion);
      } else if (value !== '') {
        const candidates = getCompletionCandidates(value, COMMANDS);
        if (candidates.length > 1) {
          appendOutput({ text: `${PROMPT} ${value}`, kind: 'echo' });
          appendOutput({ text: candidates.join('  '), kind: 'system' });
        }
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void submit(value);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      navigateHistory(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      navigateHistory(1);
    }
  }

  return (
    <div className="devkit-terminal" onClick={focusInput}>
      <div className="devkit-terminal-header">
        <div className="devkit-window-controls">
          <div className="devkit-control close" />
          <div className="devkit-control minimize" />
          <div className="devkit-control maximize" />
        </div>
        <div className="devkit-terminal-title">datisa.dev - Universal DevKit</div>
      </div>
      <div className="devkit-output" ref={outputRef}>
        {output.map((line, index) => (
          <div key={index} className={`output-line ${line.kind}`}>
            {renderHighlighted(line.text, 'highlights' in line ? line.highlights : undefined)}
          </div>
        ))}
        <div className="input-line">
          <span className="prompt">{PROMPT}</span>
          <div className="command-input-wrapper">
            <div className="ghost-suggestion" aria-hidden="true">
              {inputSegments.map((segment, i) => (
                <span key={i} className={segment.className}>
                  {segment.text}
                </span>
              ))}
              <span className="ghost-rest">{suggestion ?? ''}</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="command-input"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
