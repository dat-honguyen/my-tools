export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  device: 'mobile' | 'tablet' | 'desktop';
}

const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg\/([\d.]+)/, 'Edge'],
  [/OPR\/([\d.]+)/, 'Opera'],
  [/Chrome\/([\d.]+)/, 'Chrome'],
  [/Firefox\/([\d.]+)/, 'Firefox'],
  [/Version\/([\d.]+).*Safari/, 'Safari'],
];

function detectDevice(ua: string): ParsedUserAgent['device'] {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectOs(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT/.test(ua)) return 'Windows';
  // Must precede the Mac OS X check — iOS UAs include "like Mac OS X".
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const os = detectOs(ua);
  const device = detectDevice(ua);

  for (const [pattern, name] of BROWSER_PATTERNS) {
    const match = ua.match(pattern);
    if (match) return { browser: name, browserVersion: match[1], os, device };
  }

  return { browser: 'Unknown', browserVersion: '', os, device };
}
