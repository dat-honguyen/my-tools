import { Type } from '@angular/core';
import { GuidV4 } from './tools/guid-v4/guid-v4';

export interface ToolDefinition {
  id: string;
  label: string;
  component: Type<unknown>;
}

export const TOOLS: ToolDefinition[] = [{ id: 'guid-v4', label: 'GUID v4', component: GuidV4 }];
