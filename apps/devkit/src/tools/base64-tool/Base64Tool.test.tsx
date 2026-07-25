import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Base64Tool } from './Base64Tool';

describe('Base64Tool', () => {
  it('encodes by default', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.type(screen.getByLabelText('Text'), 'hello');
    expect(screen.getByText('aGVsbG8=')).toBeInTheDocument();
  });

  it('decodes when Decode is selected', async () => {
    const user = userEvent.setup();
    render(<Base64Tool />);
    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByLabelText('Base64'), 'aGVsbG8=');
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
