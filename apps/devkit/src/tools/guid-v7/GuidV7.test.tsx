import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuidV7 } from './GuidV7';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GuidV7', () => {
  it('shows a v7 UUID and regenerates on click', async () => {
    const user = userEvent.setup();
    render(<GuidV7 />);
    const first = screen.getByText(UUID_V7).textContent;
    expect(first).toMatch(UUID_V7);
    await user.click(screen.getByRole('button', { name: 'Generate new' }));
    expect(screen.getByText(UUID_V7).textContent).not.toBe(first);
  });
});
