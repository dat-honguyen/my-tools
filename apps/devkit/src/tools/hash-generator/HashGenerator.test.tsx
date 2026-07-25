import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HashGenerator } from './HashGenerator';

describe('HashGenerator', () => {
  it('computes MD5, SHA-1, and SHA-256 for typed text', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText('Text'), 'hello');
    await waitFor(() => {
      expect(screen.getByText('5d41402abc4b2a76b9719d911017c592')).toBeInTheDocument();
    });
  });
});
