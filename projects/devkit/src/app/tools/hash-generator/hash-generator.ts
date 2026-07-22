import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { sha } from './hash-generator.util';
import { md5 } from './md5';

interface Hashes {
  md5: string;
  sha1: string;
  sha256: string;
}

@Component({
  selector: 'dk-hash-generator',
  imports: [CopyButton],
  templateUrl: './hash-generator.html',
})
export class HashGenerator {
  readonly input = signal('');
  readonly hashes = signal<Hashes | null>(null);

  async updateInput(value: string): Promise<void> {
    this.input.set(value);
    if (value === '') {
      this.hashes.set(null);
      return;
    }
    const [sha1, sha256] = await Promise.all([sha('SHA-1', value), sha('SHA-256', value)]);
    this.hashes.set({ md5: md5(value), sha1, sha256 });
  }
}
