export const SOURCE_EVIDENCE_EXCERPTS_NOT_STORED = "Source evidence excerpts were not stored." as const;

export const SOURCE_EVIDENCE_EXCERPTS_STORED_EMPTY = "Source evidence excerpts were stored empty." as const;

export type FindingEvidenceRefSnippetsWireState = "missing" | "stored-empty" | "present";

export function resolveFindingEvidenceRefSnippetsWireState(
  snippets: readonly string[] | null | undefined,
): FindingEvidenceRefSnippetsWireState {
  if (snippets === null || snippets === undefined) {
    return "missing";
  }

  const nonEmpty = snippets.filter((snippet) => snippet.trim().length > 0);

  if (nonEmpty.length === 0) {
    return "stored-empty";
  }

  return "present";
}
