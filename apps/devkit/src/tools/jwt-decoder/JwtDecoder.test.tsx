import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { JwtDecoder } from './JwtDecoder';

function makeSegment(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('JwtDecoder', () => {
  it('decodes a pasted JWT into header and payload panels', async () => {
    const user = userEvent.setup();
    const token = `${makeSegment({ alg: 'HS256' })}.${makeSegment({ sub: '123' })}.sig`;
    render(<JwtDecoder />);
    await user.type(screen.getByLabelText('JWT'), token);
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    expect(screen.getByText(/"sub": "123"/)).toBeInTheDocument();
  });
});
