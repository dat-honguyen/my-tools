import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { DecodedJwt, decodeJwt } from './jwt-decoder.util';

@Component({
  selector: 'dk-jwt-decoder',
  imports: [CopyButton],
  templateUrl: './jwt-decoder.html',
})
export class JwtDecoder {
  readonly input = signal('');

  readonly result = computed<Result<DecodedJwt>>(() => tryResult(() => decodeJwt(this.input())));

  updateInput(value: string): void {
    this.input.set(value);
  }

  format(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
