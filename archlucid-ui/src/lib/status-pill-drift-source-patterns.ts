/** TB-2289 — Known ad-hoc status-pill class patterns outside canonical chips. */
export const AD_HOC_STATUS_PILL_CLASS_PATTERNS = [
  /\brounded-full\b[^"'`]{0,120}\bbg-(?:teal|emerald|amber|rose|green|red)-/,
  /\brounded-full\b[^"'`]{0,120}\btext-(?:teal|emerald|amber|rose|green|red)-/,
  /\brounded-full\b[^"'`]{0,120}\bborder-(?:teal|emerald|amber|rose)-/,
] as const;

/** TB-2289 — Ban new production imports of deprecated StatusPill. */
export const STATUS_PILL_IMPORT_PATTERN = /from ["']@\/components\/StatusPill["']/;

export function findAdHocStatusPillClassViolations(source: string): readonly string[] {
  const matches: string[] = [];

  for (const pattern of AD_HOC_STATUS_PILL_CLASS_PATTERNS) {
    if (pattern.test(source)) {
      matches.push(pattern.source);
    }
  }

  return matches;
}

export function findStatusPillImportViolations(source: string): readonly string[] {
  return STATUS_PILL_IMPORT_PATTERN.test(source) ? [STATUS_PILL_IMPORT_PATTERN.source] : [];
}
