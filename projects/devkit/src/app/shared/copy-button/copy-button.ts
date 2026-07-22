import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'dk-copy-button',
  imports: [],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
})
export class CopyButton {
  readonly text = input.required<string>();
  readonly copied = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.text());
    this.copied.set(true);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), 1500);
  }
}
