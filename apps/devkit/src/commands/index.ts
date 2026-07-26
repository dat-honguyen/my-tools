import { guidv4 } from './guidv4';
import { guidv7 } from './guidv7';
import { hash } from './hash';
import { base64Command } from './base64';
import { url } from './url';
import { caseCommand } from './case';
import { jwt } from './jwt';
import { jsonCommand } from './json';
import { regex } from './regex';
import { date } from './date';
import { epoch } from './epoch';
import type { CommandSpec } from './types';

export const COMMANDS: CommandSpec[] = [
  guidv4,
  guidv7,
  hash,
  base64Command,
  url,
  caseCommand,
  jwt,
  jsonCommand,
  regex,
  date,
  epoch,
];
