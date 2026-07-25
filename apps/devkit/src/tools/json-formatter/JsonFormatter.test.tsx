import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { JsonFormatter } from './JsonFormatter';

describe('JsonFormatter', () => {
  it('pretty-prints valid JSON by default', async () => {
    const { container } = render(<JsonFormatter />);
    const input = screen.getByLabelText('JSON input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{"a":1}' } });
    const output = container.querySelector('code.output-value');
    expect(output?.textContent).toBe('{\n  "a": 1\n}');
  });

  it('minifies when the Minify button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<JsonFormatter />);
    const input = screen.getByLabelText('JSON input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{"a":1}' } });
    await user.click(screen.getByRole('button', { name: 'Minify' }));
    const output = container.querySelector('code.output-value');
    expect(output?.textContent).toBe('{"a":1}');
  });

  it('shows an error for invalid JSON', async () => {
    render(<JsonFormatter />);
    const input = screen.getByLabelText('JSON input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '{not json}' } });
    expect(screen.getByText(/Unexpected token|not valid JSON|Expected property/)).toBeInTheDocument();
  });
});
