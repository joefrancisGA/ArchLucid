import { buyerFacingReviewTerminology } from "@/lib/review-terminology-copy";
import {
  ARCHITECTURE_REVIEW_LABEL,
  REVIEW_PACKAGE_LABEL,
  SIGNED_MANIFEST_LABEL,
} from "@/lib/usability/canonical-product-terms";

/**
 * Help-only replacements — preserves technical filenames like `manifest.json` (Azure extractor).
 * Canon: Architecture review = workflow; Architecture package = durable outputs (UI glossary).
 */
const HELP_PRODUCT_LANGUAGE_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\breview packages\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()}s`],
  [/\breview package\b/gi, REVIEW_PACKAGE_LABEL.toLowerCase()],
  [/\bevidence packages\b/gi, "evidence bundles"],
  [/\bevidence package\b/gi, "evidence bundle"],
  [/\bgolden manifests\b/gi, `${SIGNED_MANIFEST_LABEL}s`],
  [/\bgolden manifest\b/gi, SIGNED_MANIFEST_LABEL],
  [/\bmanifest summary\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} summary`],
  [/\bmanifest not found\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} not found`],
  [/\bmanifest exists\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} exists`],
  [/\bfor that manifest\b/gi, `for that ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\bmissing manifest\b/gi, `missing ${REVIEW_PACKAGE_LABEL.toLowerCase()}`],
  [/\bmanifest id\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()} id`],
  [/\bextractor manifest issue\b/gi, "extractor package validation issue"],
  [/\bRunId=/g, "ReviewId="],
  [/\brun id\b/gi, "review id"],
  [/\brun not ready for commit\b/gi, "review not ready to finalize"],
  [/\brun not ready\b/gi, "review not ready"],
  [/\barchitecture run\b/gi, ARCHITECTURE_REVIEW_LABEL.toLowerCase()],
  [/\bfor this run\b/gi, "for this review"],
  [/\bthe run\b/gi, "the review"],
  [/\bmanifests when governance\b/gi, `${REVIEW_PACKAGE_LABEL.toLowerCase()}s when governance`],
  [/\boperator shell\b/gi, "architect workspace"],
  [/\bpilot operator\b/gi, "architect"],
];

/** Legacy browser paths surfaced in help copy — align with TB-399 redirect posture. */
export function rewriteLegacyHelpOperatorRoutes(markdown: string): string {
  let result = markdown;

  result = result.replace(/\/runs\//g, "/reviews/");
  result = result.replace(/\/runs\b/g, "/reviews");
  result = result.replace(/\/reviews\/([^)/\s]+)\/manifest\b/g, "/reviews/$1/signed-record");
  result = result.replace(/\/manifests\//g, "/signed-records/");

  return result;
}

/** Normalizes legacy manifest/run jargon in in-app help topics and search excerpts. */
export function applyHelpTopicProductLanguage(markdown: string): string {
  let result = buyerFacingReviewTerminology(markdown);

  for (const [pattern, replacement] of HELP_PRODUCT_LANGUAGE_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return rewriteLegacyHelpOperatorRoutes(result);
}

/** Lowercase fragments that must not appear in help presentation output (buyer-facing). */
export const HELP_TOPIC_BANNED_COPY_PATTERNS = [
  "review package",
  "review packages",
  "evidence package",
  "golden manifest",
  "manifest summary",
  "manifest not found",
  "manifest exists",
  "for that manifest",
  "/runs/",
  "run not ready",
  "architecture" + " run",
  "operator shell",
  "pilot operator",
] as const;
