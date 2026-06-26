import { buyerFacingReviewTerminology } from "@/lib/review-terminology-copy";
import {
  ARCHITECTURE_REVIEW_LABEL,
  REVIEW_PACKAGE_LABEL,
  SIGNED_MANIFEST_LABEL,
} from "@/lib/usability/canonical-product-terms";

/** Operator-facing phrases that must not appear in rendered help after product-language normalization. */
export const HELP_PRODUCT_LANGUAGE_BANNED_PATTERNS = [
  /\bgolden manifest\b/i,
  /\barchitecture run execution failed\b/i,
  /\bmanifest not found\b/i,
  /\]\(\/runs\//i,
] as const;

const HELP_ADDITIONAL_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bmanifest exists\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} exists`],
  [/\bfor that manifest\b/gi, `for that ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\bArchitecture run execution failed\b/gi, `${ARCHITECTURE_REVIEW_LABEL} execution failed`],
  [/\ba single architecture run\b/gi, `a single ${ARCHITECTURE_REVIEW_LABEL.toLowerCase()}`],
  [/\bgolden manifest\b/gi, SIGNED_MANIFEST_LABEL.toLowerCase()],
  [/\bmanifest not found\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} not found`],
  [/\bopen manifest\b/gi, `open ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
];

/** Rewrites legacy operator UI paths in help copy to TB-399 review-first routes. */
export function rewriteLegacyHelpOperatorRoutes(text: string): string {
  return text
    .replace(/\[(\/runs\/[^\]]+)\]/g, (_match, path: string) => `[${path.replace(/^\/runs\//, "/reviews/")}]`)
    .replace(/\]\(\/runs\//g, "](/reviews/")
    .replace(/\]\(\/runs\/new\)/g, "](/reviews/new)")
    .replace(/`\/runs\//g, "`/reviews/")
    .replace(/`\/runs\/new`/g, "`/reviews/new`")
    .replace(/\(\/runs\//g, "(/reviews/")
    .replace(/\(\/runs\/new\)/g, "(/reviews/new)");
}

/** Applies review-package vocabulary and legacy route rewrites to in-app help copy. */
export function applyHelpProductLanguage(text: string): string {
  let result = buyerFacingReviewTerminology(text);

  for (const [pattern, replacement] of HELP_ADDITIONAL_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return rewriteLegacyHelpOperatorRoutes(result);
}

/** Returns true when rendered help copy still contains legacy manifest/run-primary phrasing. */
export function helpProductLanguageDriftDetected(text: string): boolean {
  return HELP_PRODUCT_LANGUAGE_BANNED_PATTERNS.some((pattern) => pattern.test(text));
}
