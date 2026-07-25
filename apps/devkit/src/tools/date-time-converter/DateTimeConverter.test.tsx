import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DateTimeConverter } from './DateTimeConverter';

describe('DateTimeConverter', () => {
  it('converts a typed ISO date into the three output rows', async () => {
    const user = userEvent.setup();
    render(<DateTimeConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), '2024-01-15T12:00:00Z');
    expect(screen.getByText('2024-01-15T12:00:00.000Z')).toBeInTheDocument();
  });

  it('shows an error for invalid input', async () => {
    const user = userEvent.setup();
    render(<DateTimeConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), 'nope');
    expect(screen.getByText('Invalid date: nope')).toBeInTheDocument();
  });
});
