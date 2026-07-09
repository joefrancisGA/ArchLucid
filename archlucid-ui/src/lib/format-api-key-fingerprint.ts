/**
 * Converts masked API key segments (e.g. `****cdef`) into buyer-safe fingerprint labels.
 */
export function formatApiKeyFingerprint(maskedSegment: string): string {
  const trimmed = maskedSegment.trim();
  const suffixMatch = trimmed.match(/\*+([a-zA-Z0-9]{2,})$/);

  if (suffixMatch !== null) {
    return `Ends in ${suffixMatch[1]}`;
  }

  const alphanumericTail = trimmed.match(/([a-zA-Z0-9]{2,})$/);

  if (alphanumericTail !== null) {
    return `Ends in ${alphanumericTail[1]}`;
  }

  return "Configured";
}

export function formatApiKeyFingerprints(maskedSegments: readonly string[]): string {
  if (maskedSegments.length === 0) {
    return "—";
  }

  if (maskedSegments.length === 1) {
    return formatApiKeyFingerprint(maskedSegments[0] ?? "");
  }

  return maskedSegments.map((segment) => formatApiKeyFingerprint(segment)).join(", ");
}
