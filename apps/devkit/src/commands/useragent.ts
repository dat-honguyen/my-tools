import { parseUserAgent } from '../tools/user-agent/user-agent.util';
import type { CommandSpec } from './types';

export const useragent: CommandSpec = {
  id: 'useragent',
  summary: "Parse a User-Agent string into browser/OS/device (defaults to this browser's own)",
  args: [{ name: 'text', kind: 'string', optional: true }],
  run(args) {
    const ua = args.length > 0 ? args.join(' ') : navigator.userAgent;
    const result = parseUserAgent(ua);
    const text = [
      `Browser: ${result.browser}${result.browserVersion ? ` ${result.browserVersion}` : ''}`,
      `OS: ${result.os}`,
      `Device: ${result.device}`,
      '',
      ua,
    ].join('\n');
    return { text, kind: 'success' };
  },
};
