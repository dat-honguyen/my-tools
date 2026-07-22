import { TestBed } from '@angular/core/testing';
import { EpochConverter } from './epoch-converter';

describe('EpochConverter', () => {
  it('converts epoch seconds to a UTC date string', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.componentInstance.updateEpochInput('1705320000');
    fixture.detectChanges();

    const result = fixture.componentInstance.epochResult();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.utc).toBe('2024-01-15T12:00:00.000Z');
    }
  });

  it('converts a date string to epoch seconds and milliseconds', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.componentInstance.updateDateInput('2024-01-15T12:00:00Z');
    fixture.detectChanges();

    const result = fixture.componentInstance.dateResult();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.seconds).toBe(1705320000);
    }
  });

  it('defaults the date converter to now when the input is empty', () => {
    const fixture = TestBed.createComponent(EpochConverter);
    fixture.detectChanges();
    expect(fixture.componentInstance.dateResult().ok).toBe(true);
  });
});
