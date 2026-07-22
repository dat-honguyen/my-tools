import { TestBed } from '@angular/core/testing';
import { GuidV4 } from './guid-v4';

describe('GuidV4', () => {
  it('generates a valid v4 UUID on creation', () => {
    const fixture = TestBed.createComponent(GuidV4);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a new UUID when regenerate is called', () => {
    const fixture = TestBed.createComponent(GuidV4);
    fixture.detectChanges();
    const first = fixture.componentInstance.value();
    fixture.componentInstance.regenerate();
    expect(fixture.componentInstance.value()).not.toBe(first);
    expect(fixture.componentInstance.value()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
