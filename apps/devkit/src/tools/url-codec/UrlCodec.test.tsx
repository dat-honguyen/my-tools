import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UrlCodec } from './UrlCodec';

describe('UrlCodec', () => {
  it('encodes by default', async () => {
    const user = userEvent.setup();
    render(<UrlCodec />);
    await user.type(screen.getByLabelText('Text'), 'a b');
    expect(screen.getByText('a%20b')).toBeInTheDocument();
  });

  it('decodes when Decode is selected', async () => {
    const user = userEvent.setup();
    render(<UrlCodec />);
    await user.click(screen.getByRole('button', { name: 'Decode' }));
    await user.type(screen.getByLabelText('Text'), 'a%20b');
    expect(screen.getByText('a b')).toBeInTheDocument();
  });
});
