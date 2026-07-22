import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { decodeBase64, encodeBase64 } from './base64-tool.util';

@Component({
  selector: 'dk-base64-tool',
  imports: [CopyButton],
  templateUrl: './base64-tool.html',
})
export class Base64Tool {
  readonly direction = signal<'encode' | 'decode'>('encode');
  readonly input = signal('');

  readonly result = computed<Result<string>>(() =>
    tryResult(() =>
      this.direction() === 'encode' ? encodeBase64(this.input()) : decodeBase64(this.input()),
    ),
  );

  setDirection(direction: 'encode' | 'decode'): void {
    this.direction.set(direction);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }
}
