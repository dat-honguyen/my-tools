import { TestBed } from '@angular/core/testing';
import { GuidV7 } from './guid-v7';

describe('GuidV7', () => {
  it('generates a valid v7 UUID on creation', () => {
    const fixture = TestBed.createComponent(GuidV7);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when regenerate is called', () => {
    const fixture = TestBed.createComponent(GuidV7);
    fixture.detectChanges();
    const first = fixture.componentInstance.value();
    fixture.componentInstance.regenerate();
    expect(fixture.componentInstance.value()).not.toBe(first);
  });
});
