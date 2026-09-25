/** Shorten UUID-like identifiers for header metadata while full values stay in disclosure. */
export function formatShortId(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}…`;
}
