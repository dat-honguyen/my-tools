import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { generateUuidV7 } from './guid-v7.util';

@Component({
  selector: 'dk-guid-v7',
  imports: [CopyButton],
  templateUrl: './guid-v7.html',
})
export class GuidV7 {
  readonly value = signal(generateUuidV7());

  regenerate(): void {
    this.value.set(generateUuidV7());
  }
}
