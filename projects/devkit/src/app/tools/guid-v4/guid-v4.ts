import { Component, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';

@Component({
  selector: 'dk-guid-v4',
  imports: [CopyButton],
  templateUrl: './guid-v4.html',
})
export class GuidV4 {
  readonly value = signal(crypto.randomUUID());

  regenerate(): void {
    this.value.set(crypto.randomUUID());
  }
}
