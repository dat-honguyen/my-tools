import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { formatJson } from './json-formatter.util';

@Component({
  selector: 'dk-json-formatter',
  imports: [CopyButton],
  templateUrl: './json-formatter.html',
})
export class JsonFormatter {
  readonly input = signal('');
  readonly mode = signal<'pretty' | 'minify'>('pretty');

  readonly result = computed<Result<string>>(() =>
    tryResult(() => formatJson(this.input(), this.mode())),
  );

  updateInput(value: string): void {
    this.input.set(value);
  }

  setMode(mode: 'pretty' | 'minify'): void {
    this.mode.set(mode);
  }
}
