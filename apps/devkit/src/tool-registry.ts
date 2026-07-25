import type { ComponentType } from 'react';
import { GuidV4 } from './tools/guid-v4/GuidV4';
import { GuidV7 } from './tools/guid-v7/GuidV7';
import { DateTimeConverter } from './tools/date-time-converter/DateTimeConverter';
import { EpochConverter } from './tools/epoch-converter/EpochConverter';
import { JsonFormatter } from './tools/json-formatter/JsonFormatter';
import { Base64Tool } from './tools/base64-tool/Base64Tool';
import { JwtDecoder } from './tools/jwt-decoder/JwtDecoder';
import { HashGenerator } from './tools/hash-generator/HashGenerator';
import { UrlCodec } from './tools/url-codec/UrlCodec';
import { CaseConverter } from './tools/case-converter/CaseConverter';
import { RegexTester } from './tools/regex-tester/RegexTester';

export interface ToolDefinition {
  id: string;
  label: string;
  component: ComponentType;
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
  { id: 'regex-tester', label: 'Regex Tester', component: RegexTester },
];
