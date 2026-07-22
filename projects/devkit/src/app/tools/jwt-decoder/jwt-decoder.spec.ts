import { TestBed } from '@angular/core/testing';
import { JwtDecoder } from './jwt-decoder';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('JwtDecoder', () => {
  it('decodes a valid JWT into header and payload', () => {
    const fixture = TestBed.createComponent(JwtDecoder);
    fixture.componentInstance.updateInput(SAMPLE_JWT);
    fixture.detectChanges();

    const result = fixture.componentInstance.result();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    }
  });

  it('surfaces an error for malformed input', () => {
    const fixture = TestBed.createComponent(JwtDecoder);
    fixture.componentInstance.updateInput('not-a-jwt');
    fixture.detectChanges();

    expect(fixture.componentInstance.result().ok).toBe(false);
  });
});
