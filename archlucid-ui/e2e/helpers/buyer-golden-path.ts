import { expect, type Page } from "@playwright/test";

import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "@/lib/showcase-static-demo";

import {
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "../fixtures";
import { getAppMain } from "./app-main";
import { escapeRegExpSource } from "./escape-reg-exp-source";
import { expectAnyLocatorVisible } from "./locator-readiness";
import { waitForAppReady } from "./waits";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_DEMO_RUN_ID);

/** Canonical five-step buyer spine URLs (aligned with `buyer-golden-journey-nav.ts`). */
export function showcaseSignedManifestBrowserUrlPattern(): RegExp {
  return new RegExp(
    `(?:/(?:governance/)?signed-records/${escapeRegExpSource(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}|/reviews/${escapeRegExpSource(SHOWCASE_DEMO_RUN_ID)}/signed-record)`,
  );
}

export function isShowcaseSignedManifestBrowserPath(pathname: string): boolean {
  return showcaseSignedManifestBrowserUrlPattern().test(pathname);
}

export const BUYER_GOLDEN_PATH_HREFS = {
  executive: `/architecture/reviews/${showcaseRunEnc}`,
  reviewPackage: `/architecture/reviews/${showcaseRunEnc}`,
  signedManifestFriendly: `/architecture/reviews/${showcaseRunEnc}/signed-record`,
  signedManifestCanonical: `/governance/signed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`,
  evidenceGraph: `/insights/evidence-graph?runId=${showcaseRunEnc}`,
  governanceApproval: `/governance/approval-queue?runId=${showcaseRunEnc}`,
  auditTrail: `/governance/audit?runId=${showcaseRunEnc}`,
  governanceFindings: "/governance/findings",
  policyPackDetail: "/governance/policy-packs/demo-healthcare-claims-pack",
  ask: `/insights/ask-review-questions?runId=${showcaseRunEnc}`,
  compare: `/insights/compare-two-reviews?${new URLSearchParams({
    leftRunId: SCREENSHOT_LEFT_RUN_ID,
    rightRunId: SCREENSHOT_RIGHT_RUN_ID,
  }).toString()}`,
} as const;

/** Buyer audit page title when scoped to the showcase run (`AuditPageView`). */
export const BUYER_SHOWCASE_AUDIT_TRAIL_HEADING = "Audit trail for Claims Intake Modernization";

/** Review detail workspace H1 for showcase run (`deriveReviewHeaderPresentation` system name). */
export const BUYER_SHOWCASE_EXECUTIVE_HEADLINE = SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;

/** Procurement-oriented package label in cards, breadcrumbs, and static demo copy. */
export const BUYER_SHOWCASE_REVIEW_PACKAGE_HEADLINE = SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE;

/** Playwright-accessible name may include status chips inside the H1 flex row. */
export const BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN =
  /Claims Intake Modernization(?: Review(?: Package)?)?/i;

export async function expectNoGenericErrorBoundary(page: Page): Promise<void> {
  await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
}

/**
 * Executive step readiness: legacy CTO above-fold hero, classic "Executive summary" label, or tabbed buyer-golden
 * review detail (`data-buyer-golden-ready` / workspace shell) used by live API demo workspace runs.
 */
export async function expectBuyerExecutiveSummarySurface(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 60_000;

  await waitForAppReady(page);
  await expectAnyLocatorVisible(
    [
      page.locator('[data-buyer-golden-ready="true"]'),
      page.getByTestId("review-detail-workspace"),
      page.getByTestId("cto-demo-executive-above-fold"),
      page.getByText("Executive summary", { exact: true }),
    ],
    timeout,
  );
}

/**
 * Live API executive route: subnav can expose "Executive summary" before the page H1 hydrates ??? wait for the
 * review shell and its primary heading (executive shell has no global H1 like the operator sidebar chrome).
 */
export async function expectBuyerExecutiveReviewPrimaryHeading(page: Page, options?: { timeout?: number }): Promise<void> {
  await expectBuyerReviewPackagePrimaryHeading(page, options);
}

/** Review detail H1 after buyer-golden hydration (operator shell includes its own chrome H1). */
export async function expectBuyerReviewPackagePrimaryHeading(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 60_000;

  await expect(getAppMain(page).getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout });
}

/** Buyer golden path review is hydrated with headline + manifest data. */
export async function expectBuyerGoldenPageReady(page: Page): Promise<void> {
  await waitForAppReady(page);
  await expect(page.locator('[data-buyer-golden-ready="true"]')).toBeVisible({ timeout: 60_000 });
}

/** Layer strip stepper is present on curated spine routes in buyer-polished mock E2E. */
export async function expectBuyerGoldenJourneyStepper(page: Page): Promise<void> {
  await waitForAppReady(page);
  await expect(page.getByTestId("buyer-golden-journey-stepper")).toBeVisible({ timeout: 60_000 });
}
