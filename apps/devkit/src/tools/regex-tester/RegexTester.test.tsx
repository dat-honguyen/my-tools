import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RegexTester } from './RegexTester';

describe('RegexTester', () => {
  it('reports the match count for a pattern', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText('Pattern'), '\\d+');
    await user.type(screen.getByLabelText('Test string'), 'a1 b22 c333');
    expect(screen.getByText('3 match(es)')).toBeInTheDocument();
  });

  it('shows the replaced string when a replacement is typed', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText('Pattern'), '\\d+');
    await user.type(screen.getByLabelText('Test string'), 'a1 b22');
    await user.type(screen.getByLabelText('Replacement (optional)'), 'X');
    expect(screen.getByText('aX bX')).toBeInTheDocument();
  });
});
