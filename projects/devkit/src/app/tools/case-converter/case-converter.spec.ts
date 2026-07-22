import { TestBed } from '@angular/core/testing';
import { CaseConverter } from './case-converter';

describe('CaseConverter', () => {
  it('converts input into all four cases', () => {
    const fixture = TestBed.createComponent(CaseConverter);
    fixture.componentInstance.updateInput('hello world');
    fixture.detectChanges();

    expect(fixture.componentInstance.camelCase()).toBe('helloWorld');
    expect(fixture.componentInstance.pascalCase()).toBe('HelloWorld');
    expect(fixture.componentInstance.snakeCase()).toBe('hello_world');
    expect(fixture.componentInstance.kebabCase()).toBe('hello-world');
  });
});
