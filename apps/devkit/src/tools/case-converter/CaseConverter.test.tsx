import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CaseConverter } from './CaseConverter';

describe('CaseConverter', () => {
  it('shows all four case forms for typed text', async () => {
    const user = userEvent.setup();
    render(<CaseConverter />);
    await user.type(screen.getByLabelText('Text'), 'hello world');
    expect(screen.getByText('helloWorld')).toBeInTheDocument();
    expect(screen.getByText('HelloWorld')).toBeInTheDocument();
    expect(screen.getByText('hello_world')).toBeInTheDocument();
    expect(screen.getByText('hello-world')).toBeInTheDocument();
  });
});
