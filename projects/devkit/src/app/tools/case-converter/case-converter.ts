import { Component, computed, signal } from '@angular/core';
import { CopyButton } from '../../shared/copy-button/copy-button';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from './case-converter.util';

@Component({
  selector: 'dk-case-converter',
  imports: [CopyButton],
  templateUrl: './case-converter.html',
})
export class CaseConverter {
  readonly input = signal('');

  readonly camelCase = computed(() => toCamelCase(this.input()));
  readonly pascalCase = computed(() => toPascalCase(this.input()));
  readonly snakeCase = computed(() => toSnakeCase(this.input()));
  readonly kebabCase = computed(() => toKebabCase(this.input()));

  updateInput(value: string): void {
    this.input.set(value);
  }
}
