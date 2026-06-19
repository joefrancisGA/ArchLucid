/**
 * Buyer-facing copy normalization: prefer review / review package over legacy run-primary labels.
 * API fields (`runId`, routes) are unchanged — display strings only.
 */

const RUN_PRIMARY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bcannot create runs\b/gi, "cannot create reviews"],
  [/\bcreate runs\b/gi, "create reviews"],
  [/\barchitecture runs\b/gi, "architecture reviews"],
  [/\barchitecture run\b/gi, "architecture review"],
  [/\bparent run\b/gi, "parent review"],
  [/\bseparate run\b/gi, "separate review"],
  [/\bre-run on real\b/gi, "re-execute in Real"],
  [/\brun the assessment\b/gi, "execute the review"],
  [/\brun-create\b/gi, "review-create"],
  [/\bstarter run\b/gi, "starter review"],
];

/** Maps legacy run-primary phrases in operator-visible strings to review-first vocabulary. */
export function buyerFacingReviewTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of RUN_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}
