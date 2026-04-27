/** Single-line preview for dense tables (not for security redaction). */
export function truncateForList(text: string, maxChars: number): string {
  const t = text.trim();

  if (t.length <= maxChars) {
    return t;
  }

  return `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}
