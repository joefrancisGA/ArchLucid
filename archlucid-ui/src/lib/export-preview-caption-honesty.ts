export const EXPORT_PREVIEW_SHORTENED_SUFFIX = " (shortened)" as const;

export function formatExportPreviewShortenedText(
  value: string | null | undefined,
  notStoredLabel: string,
  maxChars = 96,
  storedEmptyLabel?: string,
): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return storedEmptyLabel ?? notStoredLabel;
  }

  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  const prefixLength = Math.max(1, maxChars - EXPORT_PREVIEW_SHORTENED_SUFFIX.length);

  return `${trimmed.slice(0, prefixLength)}${EXPORT_PREVIEW_SHORTENED_SUFFIX}`;
}

export function formatExportPreviewCapIntro(shown: number, total: number, noun: string): string {
  if (total <= shown) {
    return `${shown} ${noun}`;
  }

  return `${shown} of ${total} ${noun}`;
}
