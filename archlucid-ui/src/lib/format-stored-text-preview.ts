/** Appends when UI shows only the first N characters of stored prose. */
export function formatStoredTextPreview(
  text: string,
  maxChars: number,
  continuationNote: string,
): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  const preview = trimmed.slice(0, Math.max(0, maxChars - 1)).trimEnd();

  return `${preview}… (${continuationNote})`;
}

export const STORED_TEXT_PREVIEW_CONTINUATION = {
  decisionDeltaTitle: "Full finding title was stored; only a preview is shown.",
  decisionDeltaEvidenceHint: "Full evidence anchor was stored; only a preview is shown.",
  evidenceRefSnippet: "Full evidence ref was stored; only a preview is shown.",
  policyCitationExcerpt: "Full policy citation excerpt was stored; only a preview is shown.",
  proseAssumptionStatement: "Full assumption statement was stored; only a preview is shown.",
  scopeOverview: "Full scope overview was stored; only a preview is shown.",
  architectureSummarySection: "Full section text was stored; only a preview is shown.",
  adrNarrative: "Full narrative was stored; only a preview is shown.",
  mermaidNodeLabel: "Full node label was stored; only a preview is shown.",
  generatedDiagramName: "Full generated resource name was stored; only a preview is shown.",
} as const;
