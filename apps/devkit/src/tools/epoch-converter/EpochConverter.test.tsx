import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EpochConverter } from './EpochConverter';

describe('EpochConverter', () => {
  it('converts a typed epoch to UTC/local', async () => {
    const user = userEvent.setup();
    render(<EpochConverter />);
    await user.type(screen.getByLabelText(/Epoch \(seconds or milliseconds\)/), '1705320000');
    expect(screen.getByText('2024-01-15T12:00:00.000Z')).toBeInTheDocument();
  });

  it('converts a typed date to seconds/milliseconds', async () => {
    const user = userEvent.setup();
    render(<EpochConverter />);
    await user.type(screen.getByLabelText(/Date, or leave blank for now/), '2024-01-15T12:00:00Z');
    expect(screen.getByText('1705320000')).toBeInTheDocument();
    expect(screen.getByText('1705320000000')).toBeInTheDocument();
  });
});
