export const NOT_SEALED_REVIEW_DILIGENCE_SOURCES_PACKAGE =
  "not a full audit export";

export type BuildSealedReviewDiligenceSourcesClaimDisciplineParams = {
  readonly surfaceDescription: string;
  readonly followUp?: string;
};

/** Canonical diligence-package negation sentence for evidence-orientation claim bands. */
export function buildSealedReviewDiligenceSourcesClaimDiscipline(
  params: BuildSealedReviewDiligenceSourcesClaimDisciplineParams,
): string {
  const base = `${params.surfaceDescription} — it is ${NOT_SEALED_REVIEW_DILIGENCE_SOURCES_PACKAGE}.`;

  if (params.followUp === undefined) {
    return base;
  }

  return `${base} ${params.followUp}`;
}
