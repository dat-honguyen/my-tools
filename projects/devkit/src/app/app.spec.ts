import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TOOLS } from './tool-registry';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('lists every registered tool in the sidebar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.tool-item'),
    ).map((el) => el.textContent?.trim());
    expect(labels).toEqual(TOOLS.map((tool) => tool.label));
  });

  it('selects the first tool by default', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedId()).toBe(TOOLS[0].id);
  });

  it('can select a tool by id', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.selectTool(TOOLS[0].id);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTool()?.id).toBe(TOOLS[0].id);
  });

  it('returns undefined for an unknown tool id', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.selectTool('does-not-exist');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTool()).toBeUndefined();
  });

  it('filters the tool list by label', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.updateFilter('zzz-no-match');
    fixture.detectChanges();
    expect(fixture.componentInstance.filteredTools().length).toBe(0);
  });
});
