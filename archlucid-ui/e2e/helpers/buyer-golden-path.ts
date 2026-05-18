import { expect, type Page } from "@playwright/test";

import {
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "../fixtures";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_DEMO_RUN_ID);

/** Canonical five-step buyer spine URLs (aligned with `buyer-golden-journey-nav.ts`). */
export const BUYER_GOLDEN_PATH_HREFS = {
  executive: `/executive/reviews/${showcaseRunEnc}`,
  reviewPackage: `/reviews/${showcaseRunEnc}`,
  signedManifestFriendly: `/reviews/${showcaseRunEnc}/manifest`,
  signedManifestCanonical: `/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`,
  evidenceGraph: `/graph?runId=${showcaseRunEnc}`,
  governanceApproval: `/governance?runId=${showcaseRunEnc}`,
  auditTrail: `/audit?runId=${showcaseRunEnc}`,
  governanceFindings: "/governance/findings",
  policyPackDetail: "/governance/policy-packs/demo-healthcare-claims-pack",
  ask: `/ask?runId=${showcaseRunEnc}`,
  compare: `/compare?${new URLSearchParams({
    leftRunId: SCREENSHOT_LEFT_RUN_ID,
    rightRunId: SCREENSHOT_RIGHT_RUN_ID,
  }).toString()}`,
} as const;

/** Buyer audit page title when scoped to the showcase run (`AuditPageView`). */
export const BUYER_SHOWCASE_AUDIT_TRAIL_HEADING =
  "Audit trail for Claims Intake Modernization Review Package";

/** Executive route H1 uses run `description` from showcase static payload. */
export const BUYER_SHOWCASE_EXECUTIVE_HEADLINE = "Claims Intake Modernization Review Package";

/** Review detail H1 via `buyerFacingReviewTitleFromSummary` for the showcase run. */
export const BUYER_SHOWCASE_REVIEW_PACKAGE_HEADLINE = "Claims Intake Modernization Review";

export async function expectNoGenericErrorBoundary(page: Page): Promise<void> {
  await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
}

/** Layer strip stepper is present on curated spine routes in buyer-polished mock E2E. */
export async function expectBuyerGoldenJourneyStepper(page: Page): Promise<void> {
  await expect(page.getByTestId("buyer-golden-journey-stepper")).toBeVisible();
}
