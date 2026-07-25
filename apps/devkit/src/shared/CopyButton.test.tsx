import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CopyButton } from './CopyButton';

beforeEach(() => {
  const writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: writeTextMock },
    configurable: true,
  });
});

describe('CopyButton', () => {
  it('shows "Copy" initially and "Copied" after a click, reverting after a timeout', async () => {
    render(<CopyButton text="hello" />);

    expect(screen.getByRole('button')).toHaveTextContent('Copy');
    screen.getByRole('button').click();
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Copied'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');

    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Copy'), { timeout: 3000 });
  });
});
