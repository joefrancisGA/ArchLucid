import { buyerFacingReviewTerminology } from "@/lib/review-terminology-copy";
import { stripProductReleaseVersionLabels } from "@/lib/help-markdown/markdown-cleanup";
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
  [/\bmanifest not found\b/gi, `${ARCHITECTURE_REVIEW_LABEL.toLowerCase()} not found`],
  [/\bmanifest exists\b/gi, "review exists"],
  [/\bfor that manifest\b/gi, "for that review"],
  [/\bmissing manifest\b/gi, "missing review"],
  [/\bmanifest id\b/gi, "review id"],
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

  result = result.replace(/\/runs\//g, "/architecture/reviews/");
  result = result.replace(/\/runs\b/g, "/architecture/reviews");
  // Lookbehind avoids rewriting already-canonical `/architecture/reviews…` paths.
  result = result.replace(/(?<!\/architecture)\/reviews\//g, "/architecture/reviews/");
  result = result.replace(/(?<!\/architecture)\/reviews\b/g, "/architecture/reviews");
  result = result.replace(/\/architecture\/reviews\/([^)/\s]+)\/manifest\b/g, "/architecture/reviews/$1");
  result = result.replace(/\/manifests\//g, "/governance/sealed-records/");
  result = result.replace(/\/governance\/signed-records\//g, "/governance/sealed-records/");
  result = result.replace(/\/governance\/signed-records\b/g, "/governance/sealed-records");
  result = result.replace(/(^|[\s([>])\/signed-records\//g, "$1/governance/sealed-records/");
  result = result.replace(/(^|[\s([>])\/signed-records\b/g, "$1/governance/sealed-records");
  result = result.replace(/\/workspace\/security-trust\b/g, "/administration/security-trust");
  result = result.replace(/\/settings\/roles\b/g, "/administration/users?tab=roles");

  return result;
}

/** Normalizes legacy manifest/run jargon in in-app help topics and search excerpts. */
export function applyHelpTopicProductLanguage(markdown: string): string {
  let result = buyerFacingReviewTerminology(markdown);

  for (const [pattern, replacement] of HELP_PRODUCT_LANGUAGE_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  return stripProductReleaseVersionLabels(rewriteLegacyHelpOperatorRoutes(result));
}

/** Lowercase fragments that must not appear in help presentation output (buyer-facing). */
export const HELP_TOPIC_BANNED_COPY_PATTERNS = [
  "review package",
  "review packages",
  "evidence package",
  "golden manifest",
  "signed decision record",
  "manifest summary",
  "manifest not found",
  "manifest exists",
  "for that manifest",
  "/runs/",
  "run not ready",
  "architecture" + " run",
  "operator shell",
  "pilot operator",
  "operator permission",
  "operator access",
  "for operators",
  "an operator",
] as const;
