import { TestBed } from '@angular/core/testing';
import { JsonFormatter } from './json-formatter';

describe('JsonFormatter', () => {
  it('pretty-prints valid JSON by default', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{"a":1}');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{\n  "a": 1\n}');
    }
  });

  it('minifies when minify mode is selected', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{ "a": 1 }');
    fixture.componentInstance.setMode('minify');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{"a":1}');
    }
  });

  it('surfaces a validation error for malformed JSON', () => {
    const fixture = TestBed.createComponent(JsonFormatter);
    fixture.componentInstance.updateInput('{not json}');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
