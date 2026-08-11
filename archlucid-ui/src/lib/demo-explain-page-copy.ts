import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import { SEE_IT_PAGE_TITLE } from "@/lib/see-it-page-copy";

export const DEMO_EXPLAIN_STATUS_BANNER_TECHNICAL_DETAILS_LABEL = "Technical details";

export const DEMO_EXPLAIN_REVIEW_ID_LABEL = "Review ID";

export const DEMO_EXPLAIN_MANIFEST_VERSION_LABEL = "Manifest version";

export const DEMO_EXPLAIN_GENERATED_ISO_LABEL = "Generated (UTC)";

export const DEMO_EXPLAIN_GENERATED_PREFIX = "Generated";

export const DEMO_EXPLAIN_ILLUSTRATIVE_SAMPLE_LABEL = "Illustrative sample";

/** TB-1319: buyer-facing page chrome — not engineering provenance jargon. */
export const DEMO_EXPLAIN_PAGE_TITLE = "Sample review — evidence and explanation";

export const DEMO_EXPLAIN_PAGE_LEAD =
  "Walkthrough of how findings link to evidence and citations for the seeded example architecture review.";

export const DEMO_EXPLAIN_EVIDENCE_TRAIL_PANEL_TITLE = "Evidence trail";

export const DEMO_EXPLAIN_EXPLANATION_PANEL_TITLE = "Explanation & citations";

export const DEMO_EXPLAIN_EMPTY_EVIDENCE_TRAIL_MESSAGE =
  "This sample review has no linked evidence trail yet. Try again after the demo environment finishes seeding.";

export const DEMO_EXPLAIN_GRAPH_TECHNICAL_DETAILS_LABEL = "Technical graph details";

export const DEMO_EXPLAIN_EXPLANATION_TECHNICAL_DETAILS_LABEL = "Technical explanation details";

export const DEMO_EXPLAIN_RISK_POSTURE_PREFIX = "Overall risk posture";

export const DEMO_EXPLAIN_DETERMINISTIC_FALLBACK_NOTE =
  "A deterministic fallback explanation was used for this sample — open technical details before sponsor send.";

/** Canonical wizard entry for signed-in viewers graduating from `/demo/explain` (TB-218 / TB-219). */
export const DEMO_EXPLAIN_CONVERSION_REVIEW_HREF = "/architecture/reviews/new?preset=greenfield" as const;

export const DEMO_EXPLAIN_CONVERSION_SEE_IT_HREF = "/see-it" as const;

export const DEMO_EXPLAIN_CONVERSION_AUTHENTICATED_HEADING = "Ready to run this on your own architecture?";

export const DEMO_EXPLAIN_CONVERSION_ANONYMOUS_HEADING = "Want to run this on your own architecture?";

export const DEMO_EXPLAIN_CONVERSION_ANONYMOUS_LEAD =
  "Sign in to start a review in your workspace. This example analysis does not open the review wizard without authentication.";

export const DEMO_EXPLAIN_CONVERSION_SIGN_IN_PRIMARY = "Sign in to start a review";

export const DEMO_EXPLAIN_CONVERSION_START_REVIEW_PRIMARY = "Start a new review →";

export const DEMO_EXPLAIN_CONVERSION_SEE_IT_SECONDARY = SEE_IT_PAGE_TITLE;

export const DEMO_EXPLAIN_CONVERSION_FAB_SIGNED_IN = "Start your review";

export const DEMO_EXPLAIN_CONVERSION_FAB_ANONYMOUS = "Sign in";

export type DemoExplainStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Human-readable generated time for the default banner line — not raw ISO. */
export function formatDemoExplainGeneratedLabel(generatedUtc: string): string {
  return `${DEMO_EXPLAIN_GENERATED_PREFIX} ${formatIsoUtcForDisplay(generatedUtc)}`;
}

/** Maps demo payload flags to enterprise status metadata — never mislabels manifest version as a review. */
export function resolveDemoExplainStatusTag(isDemoData: boolean, demoStatusMessage: string): DemoExplainStatusTag {
  const trimmedMessage = demoStatusMessage.trim();

  if (trimmedMessage.length > 0) {
    return {
      kind: isDemoData ? "draft" : "ready",
      label: trimmedMessage,
    };
  }

  if (isDemoData) {
    return { kind: "draft", label: DEMO_EXPLAIN_ILLUSTRATIVE_SAMPLE_LABEL };
  }

  return { kind: "ready", label: "Ready" };
}

/** Primary CTA target — wizard when signed in, sign-in with return path when anonymous (TB-1323). */
export function resolveDemoExplainConversionPrimaryHref(canStartReview: boolean): string {
  if (canStartReview) {
    return DEMO_EXPLAIN_CONVERSION_REVIEW_HREF;
  }

  return buildAuthSignInHref({ returnPath: DEMO_EXPLAIN_CONVERSION_REVIEW_HREF });
}
