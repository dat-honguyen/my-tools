import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { Result, tryResult } from '../../shared/result';
import {
  DateToEpochResult,
  EpochToDateResult,
  dateToEpoch,
  epochToDate,
} from './epoch-converter.util';

@Component({
  selector: 'dk-epoch-converter',
  imports: [CopyButton],
  templateUrl: './epoch-converter.html',
})
export class EpochConverter {
  readonly epochInput = signal('');
  readonly dateInput = signal('');

  readonly epochResult = computed<Result<EpochToDateResult>>(() =>
    tryResult(() => epochToDate(this.epochInput())),
  );

  readonly dateResult = computed<Result<DateToEpochResult>>(() =>
    tryResult(() => dateToEpoch(this.dateInput())),
  );

  updateEpochInput(value: string): void {
    this.epochInput.set(value);
  }

  updateDateInput(value: string): void {
    this.dateInput.set(value);
  }
}
