import { Type } from '@angular/core';
import { GuidV4 } from './tools/guid-v4/guid-v4';
import { GuidV7 } from './tools/guid-v7/guid-v7';
import { DateTimeConverter } from './tools/date-time-converter/date-time-converter';
import { EpochConverter } from './tools/epoch-converter/epoch-converter';
import { JsonFormatter } from './tools/json-formatter/json-formatter';
import { Base64Tool } from './tools/base64-tool/base64-tool';
import { JwtDecoder } from './tools/jwt-decoder/jwt-decoder';
import { HashGenerator } from './tools/hash-generator/hash-generator';
import { UrlCodec } from './tools/url-codec/url-codec';
import { CaseConverter } from './tools/case-converter/case-converter';

export interface ToolDefinition {
  id: string;
  label: string;
  component: Type<unknown>;
}

export const TOOLS: ToolDefinition[] = [
  { id: 'guid-v4', label: 'GUID v4', component: GuidV4 },
  { id: 'guid-v7', label: 'GUID v7', component: GuidV7 },
  { id: 'date-time-converter', label: 'Date/Time Converter', component: DateTimeConverter },
  { id: 'epoch-converter', label: 'Epoch / Unix Converter', component: EpochConverter },
  { id: 'json-formatter', label: 'JSON Formatter/Validator', component: JsonFormatter },
  { id: 'base64-tool', label: 'Base64 Encode/Decode', component: Base64Tool },
  { id: 'jwt-decoder', label: 'JWT Decoder', component: JwtDecoder },
  { id: 'hash-generator', label: 'Hash Generator', component: HashGenerator },
  { id: 'url-codec', label: 'URL Encode/Decode', component: UrlCodec },
  { id: 'case-converter', label: 'Case Converter', component: CaseConverter },
];
