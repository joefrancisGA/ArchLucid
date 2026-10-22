/** Parses JSON response text; returns null when the body is empty or whitespace-only. */
export function tryParseJsonResponseText<T>(text: string): T | null {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return JSON.parse(trimmed) as T;
}
