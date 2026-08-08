import {
  FIRST_REVIEW_GUIDE_PATH,
  LEGACY_ONBOARDING_PATH,
} from "@/lib/first-review-guide-route";

/**
 * Traffic workbook row ID for the First review guide product hub.
 * Owner backlog shorthand: ARF.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_ROW_ID = "ARF";

/** Canonical path tracked on the ARF workbook row. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_PATH = FIRST_REVIEW_GUIDE_PATH;

/** Workbook Section column value — onboarding / first-run product hub. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_SECTION = "Onboarding";

/**
 * Owner workbook Notes for ARF - documents Evidence chrome on First review guide.
 * ASCII-only for Windows console note scripts.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_NOTE =
  "First review guide (Onboarding) - FirstReviewGuidePageClient with FirstReviewGuideEvidenceOrientationStrip (workspace Sources + claim-discipline), PageContextualHelpButton (topic map getting-started; Category-1 registry), walkthrough steps, required setup panel, optional workspace setup, and registration trial card (?source=registration). Left nav First review guide. Legacy /onboarding retired (no redirect). Sibling COR = first-architecture-review help; ANE/ARA/ARR = architectures create/list/detail; RNX = start review. Onboarding checklist only - not a signed-record Sources trail. Score 50/100 (2026-08-06) - onboarding hub Evidence chrome (below help-specialty COR 52). Former workbook row ONB.";

/** Retired onboarding bookmark path (no App Router redirect). */
export const LEGACY_ONBOARDING_TRAFFIC_PATH = LEGACY_ONBOARDING_PATH;
