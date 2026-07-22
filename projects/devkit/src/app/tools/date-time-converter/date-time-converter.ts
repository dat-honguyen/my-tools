import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import { DateTimeConversion, convertDateTime } from './date-time-converter.util';

@Component({
  selector: 'dk-date-time-converter',
  imports: [CopyButton],
  templateUrl: './date-time-converter.html',
})
export class DateTimeConverter {
  readonly timeZones = Intl.supportedValuesOf('timeZone');
  readonly input = signal('');
  readonly timeZone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);

  readonly result = computed<Result<DateTimeConversion>>(() =>
    tryResult(() => convertDateTime(this.input(), this.timeZone())),
  );

  updateInput(value: string): void {
    this.input.set(value);
  }

  updateTimeZone(value: string): void {
    this.timeZone.set(value);
  }
}
