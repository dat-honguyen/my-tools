import { Component, computed, signal } from '@angular/core';
import { Result, tryResult } from '../../shared/result';
import { RegexTestResult, testRegex } from './regex-tester.util';

@Component({
  selector: 'dk-regex-tester',
  imports: [],
  templateUrl: './regex-tester.html',
})
export class RegexTester {
  readonly pattern = signal('');
  readonly flags = signal('');
  readonly input = signal('');
  readonly replacement = signal('');
  readonly useReplacement = signal(false);

  readonly result = computed<Result<RegexTestResult>>(() =>
    tryResult(() =>
      testRegex(
        this.pattern(),
        this.flags(),
        this.input(),
        this.useReplacement() ? this.replacement() : undefined,
      ),
    ),
  );

  updatePattern(value: string): void {
    this.pattern.set(value);
  }

  updateFlags(value: string): void {
    this.flags.set(value);
  }

  updateInput(value: string): void {
    this.input.set(value);
  }

  updateReplacement(value: string): void {
    this.replacement.set(value);
    this.useReplacement.set(true);
  }
}
