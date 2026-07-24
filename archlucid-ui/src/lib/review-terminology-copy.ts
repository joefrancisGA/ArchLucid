/**
 * Buyer-facing copy normalization: prefer review / architecture review over legacy run-primary labels,
 * and signed review record over internal "golden manifest" jargon. API fields (`runId`, routes) are unchanged.
 */

import {
  REVIEW_PACKAGE_LABEL,
  SIGNED_MANIFEST_LABEL,
} from "@/lib/usability/canonical-product-terms";

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

const MANIFEST_PRIMARY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bgolden manifests\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bgolden manifest\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bcommitted manifests\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}s`],
  [/\bcommitted manifest\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\bfinalized manifest\b/gi, `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\barchitecture manifest\b/gi, REVIEW_PACKAGE_LABEL],
  [/\bmanifest diff\b/gi, "review comparison"],
  [/\bmanifest comparison\b/gi, "review comparison"],
  [/\bmanifest decision\b/gi, "review record decision"],
  [/\bmanifest summary\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} summary`],
  [/\bmanifest record\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bmanifest not found\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} not found`],
  [/\bopen manifest\b/gi, `open ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
];

/** Maps legacy run-primary phrases in operator-visible strings to review-first vocabulary. */
export function buyerFacingReviewTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of RUN_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of MANIFEST_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/** Maps API or legacy labels that still say "golden manifest" into buyer-facing signed review record copy. */
export function buyerFacingManifestTerminology(text: string): string {
  let result = text;

  for (const [pattern, replacement] of MANIFEST_PRIMARY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}
