const MAX_SNIPPET_LENGTH = 240;

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
    return `${decoded.slice(0, MAX_SNIPPET_LENGTH - 1)}…`;
  }

  return decoded;
}

/** Collects up to `limit` display snippets from a finding `evidenceRefs` wire array. */
export function collectEvidenceRefSnippets(raw: unknown, limit = 3): readonly string[] {
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
