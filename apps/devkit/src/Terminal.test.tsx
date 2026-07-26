import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Terminal } from './Terminal';

describe('Terminal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the terminal chrome and welcome banner', () => {
    render(<Terminal />);
    expect(screen.getByText('datisa.dev - Universal DevKit')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to DevKit/)).toBeInTheDocument();
  });

  it('echoes and runs a submitted command', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    expect(screen.getByText(/datisa@devkit:~\$ guidv4/)).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('prints an error for an unknown command', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'nope{Enter}');
    expect(screen.getByText(/Command not found: nope/)).toBeInTheDocument();
  });

  it('clears the output on `clear`', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    await user.type(input, 'clear{Enter}');
    expect(screen.queryByText(/guidv4/)).not.toBeInTheDocument();
  });

  it('accepts a Tab suggestion for a unique command prefix', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    // 'guidv' is ambiguous (guidv4/guidv7 both match) — 'has' uniquely matches only 'hash'.
    await user.type(input, 'has');
    await user.keyboard('{Tab}');
    expect(input).toHaveValue('hash');
  });

  it('lists candidates on Tab when the prefix is ambiguous, without clearing input', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    // 'guidv' matches both guidv4 and guidv7 — ambiguous, so Tab should list them.
    await user.type(input, 'guidv');
    await user.keyboard('{Tab}');
    expect(screen.getByText(/guidv4\s+guidv7/)).toBeInTheDocument();
    expect(input).toHaveValue('guidv');
  });

  it('cycles submitted history with ArrowUp/ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'guidv4{Enter}');
    await user.type(input, 'guidv7{Enter}');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('guidv7');
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('guidv4');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('guidv7');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('');
  });

  it('copies to clipboard and reports success for a `cp` command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'cp case camel "hello world"{Enter}');
    expect(await screen.findByText('✓ Copied to clipboard!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('helloWorld');
    vi.unstubAllGlobals();
  });

  it('`cp date` copies only the ISO string, not the full multi-line breakdown', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'cp date 2024-01-15T12:00:00Z{Enter}');
    expect(await screen.findByText('✓ Copied to clipboard!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('2024-01-15T12:00:00.000Z');
    vi.unstubAllGlobals();
  });

  it('runs the new slug/password/useragent tools', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'slug "Hello World!"{Enter}');
    expect(screen.getByText('hello-world')).toBeInTheDocument();
    await user.type(input, 'password 12 numeric{Enter}');
    expect(screen.getAllByText(/^\d{12}$/).length).toBeGreaterThan(0);
    await user.type(input, 'useragent{Enter}');
    expect(screen.getByText(/^Browser: /)).toBeInTheDocument();
  });

  it('highlights regex matches within the tested text in the output', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'regex \\d+ g "a1 b22"{Enter}');
    const mark = document.querySelector('.output-highlight');
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('1');
  });

  it('colors a known command word while typing', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    await user.type(screen.getByRole('textbox'), 'guidv4');
    const token = document.querySelector('.token-command');
    expect(token?.textContent).toBe('guidv4');
  });
});
