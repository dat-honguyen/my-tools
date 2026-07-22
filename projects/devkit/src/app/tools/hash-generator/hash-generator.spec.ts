import { TestBed } from '@angular/core/testing';
import { HashGenerator } from './hash-generator';

describe('HashGenerator', () => {
  it('computes md5, sha1 and sha256 for the given text', async () => {
    const fixture = TestBed.createComponent(HashGenerator);
    await fixture.componentInstance.updateInput('abc');
    fixture.detectChanges();

    const hashes = fixture.componentInstance.hashes();
    expect(hashes).not.toBeNull();
    expect(hashes?.md5).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(hashes?.sha1).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(hashes?.sha256).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('clears hashes when input is emptied', async () => {
    const fixture = TestBed.createComponent(HashGenerator);
    await fixture.componentInstance.updateInput('abc');
    await fixture.componentInstance.updateInput('');
    fixture.detectChanges();

    expect(fixture.componentInstance.hashes()).toBeNull();
  });
});
