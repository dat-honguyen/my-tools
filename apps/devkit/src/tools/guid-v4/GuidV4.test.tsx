import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuidV4 } from './GuidV4';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GuidV4', () => {
  it('shows a v4 UUID and regenerates a new one on click', async () => {
    const user = userEvent.setup();
    render(<GuidV4 />);

    const first = screen.getByText(UUID_V4).textContent;
    expect(first).toMatch(UUID_V4);

    await user.click(screen.getByRole('button', { name: 'Generate new' }));
    const second = screen.getByText(UUID_V4).textContent;
    expect(second).not.toBe(first);
  });
});
