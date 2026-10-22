/** Accessible name for inline help triggers beside labels, headings, and metrics. */
export function inlineHelpAriaLabel(subject: string): string {
  const trimmed = subject.trim();

  if (trimmed.length === 0) {
    return "Help";
  }

  if (trimmed.toLowerCase().startsWith("help:")) {
    return trimmed;
  }

  return `Help: ${trimmed}`;
}
