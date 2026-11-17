const EVIDENCE_REF_PATTERN = /evidence:[^\s,;]+|hop-\d+/gi;

/** Surfaces a rejected ref string beside the SecureNow citation-rejection tag when present. */
export function formatSecureNowCitationRejectionDetail(
  rejection: string,
  allowedRefs: readonly string[],
): string | null {
  const trimmed = rejection.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const allowed = new Set(allowedRefs.map((ref) => ref.trim()).filter((ref) => ref.length > 0));
  const matches = trimmed.match(EVIDENCE_REF_PATTERN) ?? [];

  for (const match of matches) {
  const candidate = match.trim();

    if (candidate.length > 0 && !allowed.has(candidate)) {
      return `Rejected citation source: ${candidate}. Allowed refs: ${allowedRefs.join(", ") || "none stored"}.`;
    }
  }

  if (trimmed.toLowerCase().includes("citation") || trimmed.toLowerCase().includes("hop")) {
    return trimmed;
  }

  return null;
}