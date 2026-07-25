import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the terminal chrome and the first tool selected by default', () => {
    render(<App />);
    expect(screen.getByText('datisa.dev - Universal DevKit')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'GUID v4' })).toBeInTheDocument();
  });

  it('filters the tool list', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByPlaceholderText('Filter tools…'), 'json');
    expect(screen.getByRole('button', { name: 'JSON Formatter/Validator' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GUID v4' })).not.toBeInTheDocument();
  });

  it('switches the detail panel when a tool is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Case Converter' }));
    expect(screen.getByRole('heading', { name: 'Case Converter' })).toBeInTheDocument();
  });
});
