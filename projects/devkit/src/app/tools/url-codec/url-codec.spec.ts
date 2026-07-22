import { TestBed } from '@angular/core/testing';
import { UrlCodec } from './url-codec';

describe('UrlCodec', () => {
  it('encodes text by default', () => {
    const fixture = TestBed.createComponent(UrlCodec);
    fixture.componentInstance.updateInput('a b');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('a%20b');
    }
  });

  it('decodes when direction is set to decode', () => {
    const fixture = TestBed.createComponent(UrlCodec);
    fixture.componentInstance.setDirection('decode');
    fixture.componentInstance.updateInput('a%20b');
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('a b');
    }
  });
});
