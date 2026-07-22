import { TestBed } from '@angular/core/testing';
import { RegexTester } from './regex-tester';

describe('RegexTester', () => {
  it('reports matches for a valid pattern', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('\\d+');
    fixture.componentInstance.updateInput('a1 b22');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.matches).toHaveLength(2);
    }
  });

  it('replaces matches once a replacement is entered', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('\\d+');
    fixture.componentInstance.updateInput('a1 b22');
    fixture.componentInstance.updateReplacement('NUM');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.replaced).toBe('aNUM bNUM');
    }
  });

  it('surfaces an error for an invalid pattern', () => {
    const fixture = TestBed.createComponent(RegexTester);
    fixture.componentInstance.updatePattern('(');
    fixture.componentInstance.updateInput('anything');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
