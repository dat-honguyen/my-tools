import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { decodeUrl, encodeUrl } from './url-codec.util';

@Component({
  selector: 'dk-url-codec',
  imports: [CopyButton],
  templateUrl: './url-codec.html',
})
export class UrlCodec {
  readonly direction = signal<'encode' | 'decode'>('encode');
  readonly input = signal('');

  readonly result = computed<Result<string>>(() =>
    tryResult(() =>
      this.direction() === 'encode' ? encodeUrl(this.input()) : decodeUrl(this.input()),
    ),
  );

  setDirection(direction: 'encode' | 'decode'): void {
    this.direction.set(direction);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }
}
