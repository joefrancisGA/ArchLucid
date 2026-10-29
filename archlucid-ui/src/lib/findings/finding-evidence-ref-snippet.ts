import {
  formatStoredTextPreview,
  STORED_TEXT_PREVIEW_CONTINUATION,
} from "@/lib/format-stored-text-preview";

const MAX_SNIPPET_LENGTH = 240;

export const FINDING_EVIDENCE_REF_SNIPPET_DISPLAY_LIMIT = 3 as const;

/** Normalizes a persisted evidence ref token into a compact human-readable snippet for review UI. */
export function normalizeEvidenceRefSnippet(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const withoutScheme = trimmed
    .replace(/^evidence:[/]{0,2}/i, "")
    .replace(/^graph:[/]{0,2}/i, "")
    .replace(/^artifact:[/]{0,2}/i, "");
  const decoded = withoutScheme.replace(/\+/g, " ");

  if (decoded.length > MAX_SNIPPET_LENGTH) {
    return formatStoredTextPreview(decoded, MAX_SNIPPET_LENGTH, STORED_TEXT_PREVIEW_CONTINUATION.evidenceRefSnippet);
  }

  return decoded;
}

/** Collects up to `limit` display snippets from a finding `evidenceRefs` wire array. */
export function collectEvidenceRefSnippets(
  raw: unknown,
  limit = FINDING_EVIDENCE_REF_SNIPPET_DISPLAY_LIMIT,
): readonly string[] {
  if (!Array.isArray(raw) || limit <= 0) {
    return [];
  }

  const out: string[] = [];

  for (const item of raw) {
    const snippet = normalizeEvidenceRefSnippet(item);

    if (snippet !== null) {
      out.push(snippet);
    }

    if (out.length >= limit) {
      break;
    }
  }

  return out;
}

/** Counts normalized snippets on the wire array (not capped by display limit). */
export function countStoredEvidenceRefSnippets(raw: unknown): number {
  if (!Array.isArray(raw)) {
    return 0;
  }

  let count = 0;

  for (const item of raw) {
    if (normalizeEvidenceRefSnippet(item) !== null) {
      count += 1;
    }
  }

  return count;
}

export function formatFindingEvidenceRefSnippetsHeading(
  displayedSnippets: readonly string[],
  totalStoredSnippetCount: number | null,
): string {
  if (displayedSnippets.length === 0) {
    return "Source evidence";
  }

  if (totalStoredSnippetCount === null || totalStoredSnippetCount <= displayedSnippets.length) {
    return "Source evidence";
  }

  return `Source evidence (showing ${displayedSnippets.length} of ${totalStoredSnippetCount} stored refs)`;
}
