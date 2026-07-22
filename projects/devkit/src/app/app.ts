import { Component, computed, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TOOLS } from './tool-registry';

@Component({
  selector: 'dk-root',
  imports: [NgComponentOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly tools = TOOLS;
  readonly filter = signal('');
  readonly selectedId = signal(TOOLS[0]?.id ?? '');

  readonly filteredTools = computed(() => {
    const query = this.filter().trim().toLowerCase();
    if (query === '') {
      return this.tools;
    }
    return this.tools.filter((tool) => tool.label.toLowerCase().includes(query));
  });

  readonly selectedTool = computed(() => this.tools.find((tool) => tool.id === this.selectedId()));

  selectTool(id: string): void {
    this.selectedId.set(id);
  }

  updateFilter(value: string): void {
    this.filter.set(value);
  }
}
