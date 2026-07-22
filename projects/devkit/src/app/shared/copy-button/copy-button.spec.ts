import { TestBed } from '@angular/core/testing';
import { CopyButton } from './copy-button';

describe('CopyButton', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the provided text to the clipboard', async () => {
    const fixture = TestBed.createComponent(CopyButton);
    fixture.componentRef.setInput('text', 'hello');
    fixture.detectChanges();

    await fixture.componentInstance.copy();

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('shows "Copied" then reverts after 1.5s', async () => {
    const fixture = TestBed.createComponent(CopyButton);
    fixture.componentRef.setInput('text', 'hello');
    fixture.detectChanges();

    await fixture.componentInstance.copy();
    expect(fixture.componentInstance.copied()).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(fixture.componentInstance.copied()).toBe(false);
  });
});
