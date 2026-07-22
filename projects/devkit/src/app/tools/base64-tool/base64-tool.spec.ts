import { TestBed } from '@angular/core/testing';
import { Base64Tool } from './base64-tool';

describe('Base64Tool', () => {
  it('encodes text by default', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.updateInput('hello');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('aGVsbG8=');
    }
  });

  it('decodes Base64 when direction is set to decode', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('aGVsbG8=');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('hello');
    }
  });

  it('surfaces an error for invalid Base64', () => {
    const fixture = TestBed.createComponent(Base64Tool);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('not base64!!!');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
