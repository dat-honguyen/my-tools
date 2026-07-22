import { TestBed } from '@angular/core/testing';
import { DateTimeConverter } from './date-time-converter';

describe('DateTimeConverter', () => {
  it('defaults to converting the current moment', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.detectChanges();
    expect(fixture.componentInstance.result().ok).toBe(true);
  });

  it('converts a pasted ISO date in the selected timezone', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.componentInstance.updateTimeZone('UTC');
    fixture.componentInstance.updateInput('2024-01-15T12:00:00Z');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.iso).toBe('2024-01-15T12:00:00.000Z');
      expect(result.value.offset).toBe('+00:00');
    }
  });

  it('surfaces an error for unparseable input', () => {
    const fixture = TestBed.createComponent(DateTimeConverter);
    fixture.componentInstance.updateInput('not a date');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
