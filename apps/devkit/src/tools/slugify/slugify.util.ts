const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
