import { expect, test, type Page } from "@playwright/test";

import { axeLiveE2eDisableRuleIdsNow } from "./axe-rule-allowlist";
import { formatViolations, runAxe } from "./helpers/axe-helper";
import {
  FIXTURE_FINDING_ID,
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID,
  FIXTURE_MANIFEST_ID,
  FIXTURE_RIGHT_RUN_ID,
  FIXTURE_RUN_ID,
  SCREENSHOT_FINDING_ID,
  SCREENSHOT_PLAN_ID,
  SCREENSHOT_POLICY_PACK_ID,
  SHOWCASE_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures/ids";

/**
 * Live API + SQL axe sweep (merge-blocking via `ui-e2e-live` / default `playwright.config.ts`).
 *
 * {@link SHOWCASE_DEMO_RUN_ID} + {@link SCREENSHOT_FINDING_ID} match `e2e/smoke.spec.ts` core path — required for
 * finding routes against the real demo catalog.
 */
const PAGES = [
  { name: "Overview", path: "/" },
  { name: "Welcome marketing", path: "/welcome" },
  { name: "Why ArchLucid marketing", path: "/why" },
  { name: "Compliance journey marketing", path: "/compliance-journey" },
  { name: "Pricing marketing", path: "/pricing" },
  { name: "Trial signup", path: "/signup" },
  { name: "First review guide (canonical)", path: "/architecture/first-review-guide" },
  { name: "New request", path: "/architecture/reviews/new" },
  { name: "Runs", path: "/architecture/reviews?projectId=default" },
  { name: "Run detail", path: `/architecture/reviews/${FIXTURE_RUN_ID}` },
  { name: "Run provenance", path: `/architecture/reviews/${FIXTURE_RUN_ID}/provenance` },
  { name: "Finding detail (showcase run)", path: `/architecture/reviews/${SHOWCASE_DEMO_RUN_ID}/findings/${SCREENSHOT_FINDING_ID}` },
  {
    name: "Finding inspect (showcase run)",
    path: `/architecture/reviews/${SHOWCASE_DEMO_RUN_ID}/findings/${SCREENSHOT_FINDING_ID}/inspect`,
  },
  { name: "Manifest detail", path: `/governance/signed-records/${FIXTURE_MANIFEST_ID}` },
  { name: "Manifest detail (empty artifacts fixture)", path: `/governance/signed-records/${FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID}` },
  { name: "Compare", path: "/insights/compare-two-reviews" },
  { name: "Replay", path: "/internal/validate-route" },
  { name: "Ask", path: "/insights/ask-review-questions" },
  { name: "Search", path: "/insights/search-review-evidence" },
  { name: "Advisory", path: "/governance/advisory-scans" },
  { name: "Graph", path: "/insights/evidence-graph" },
  { name: "Audit", path: "/governance/audit" },
  { name: "Policy packs (operator hub)", path: "/governance/policy-packs" },
  { name: "Alerts inbox (hub)", path: "/governance/alerts" },
  { name: "Alert rules", path: "/governance/alert-rules" },
  { name: "Alert rules notifications tab", path: "/governance/alert-rules?tab=notifications" },
  { name: "Alert rules test-alerts tab", path: "/governance/alert-rules?tab=test-alerts" },
  { name: "Alert rules advanced-rules tab", path: "/governance/alert-rules?tab=advanced-rules" },
  { name: "Sponsor dashboard", path: "/architecture/sponsor-dashboard" },
  { name: "Sponsor dashboard workspace health", path: "/architecture/sponsor-dashboard#workspace-health" },
  { name: "Approval queue", path: "/governance/approval-queue" },
  { name: "Standards & rules", path: "/governance/standards-and-rules" },
  { name: "Governance findings queue", path: "/governance/findings" },
  { name: "Governance policy packs", path: "/governance/policy-packs" },
  {
    name: "Governance policy pack detail (marketing slug)",
    path: `/governance/policy-packs/${encodeURIComponent(SCREENSHOT_POLICY_PACK_ID)}`,
  },
  { name: "Planning", path: "/planning" },
  { name: "Digests", path: "/architecture/digests" },
  { name: "Digest subscriptions", path: "/architecture/digests?tab=subscriptions" },
  { name: "Workspace settings", path: "/administration/tenant" },
  { name: "Settings baseline", path: "/administration/baseline" },
  { name: "Digests schedule", path: "/architecture/digests?tab=schedule" },
  { name: "Review feedback", path: "/internal/product-learning" },
  { name: "Advisory scheduling", path: "/advisory-scheduling" },
  { name: "Recommendation learning", path: "/internal/recommendation-learning" },
  { name: "Evolution review", path: "/insights/impact-preview" },
  { name: "Scorecard", path: "/insights/architecture-scorecard" },
  { name: "Value report", path: "/insights/sponsor-report" },
  { name: "ROI summary", path: "/insights/roi-summary" },
  { name: "Help", path: "/help" },
  { name: "Settings security & trust", path: "/administration/security-trust" },
  { name: "Why ArchLucid (operator)", path: "/why-archlucid" },
  { name: "Demo explain", path: "/demo/explain" },
  { name: "Microsoft Teams integration", path: "/integrations/teams" },
  { name: "Users & roles", path: "/administration/users" },
  { name: "Settings support", path: "/administration/support" },
  { name: "Admin health", path: "/internal/health" },
  { name: "Admin configuration", path: "/internal/configuration" },
  { name: "Replay (pre-filled runId)", path: `/replay?runId=${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}` },
  {
    name: "Compare (fixture left/right)",
    path: `/insights/compare-two-reviews?leftRunId=${encodeURIComponent(FIXTURE_LEFT_RUN_ID)}&rightRunId=${encodeURIComponent(FIXTURE_RIGHT_RUN_ID)}`,
  },
  { name: "Operator sign in", path: "/auth/signin" },
  { name: "Marketing accessibility statement", path: "/accessibility" },
  { name: "Marketing privacy", path: "/privacy" },
  { name: "Marketing get started", path: "/get-started" },
  {
    name: "Manifest detail (showcase static demo UUID)",
    path: `/governance/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`,
  },
  {
    name: "Planning plan detail (demo slug)",
    path: `/planning/plans/${encodeURIComponent(SCREENSHOT_PLAN_ID)}`,
  },
] as const;

/**
 * Default `ui-e2e-live` run (non-`workflow_dispatch` full matrix): tag {@link liveA11yPrTag} always includes
 * {@link GOLDEN_PATH_OPERATOR_A11Y_PAGES} plus a bounded tail from {@link PAGES}. The extended matrix uses
 * {@link liveA11yFullMatrixTag} (`--grep-invert` in CI for default runs).
 */
const LIVE_A11Y_PR_SLICE_LEN = 28;

/** Golden-path operator surfaces — always in the PR-visible subset (assessment backlog item 18). */
const GOLDEN_PATH_OPERATOR_A11Y_PAGES = [
  { name: "Overview", path: "/" },
  { name: "Reviews list (canonical /reviews)", path: "/architecture/reviews" },
  { name: "Run detail (canonical /reviews)", path: `/architecture/reviews/${FIXTURE_RUN_ID}` },
  { name: "Manifest detail", path: `/governance/signed-records/${FIXTURE_MANIFEST_ID}` },
] as const;

const goldenPathSet = new Set<string>(GOLDEN_PATH_OPERATOR_A11Y_PAGES.map((p) => p.path));
const prRemainingBudget = LIVE_A11Y_PR_SLICE_LEN - GOLDEN_PATH_OPERATOR_A11Y_PAGES.length;

/** PR-visible subset — must stay smaller than the full matrix to keep `ui-e2e-live` bounded. */
const PAGES_LIVE_A11Y_PR = [
  ...GOLDEN_PATH_OPERATOR_A11Y_PAGES,
  ...PAGES.filter((p) => !goldenPathSet.has(p.path)).slice(0, prRemainingBudget),
];
const liveA11yPrPathSet = new Set<string>(PAGES_LIVE_A11Y_PR.map((p) => p.path));

/** Extended routes (everything after the PR slice). */
const PAGES_LIVE_A11Y_EXTENDED = PAGES.filter((p) => !liveA11yPrPathSet.has(p.path));

export const liveA11yPrTag = "@live-a11y-pr";
export const liveA11yFullMatrixTag = "@live-a11y-full-matrix";

/**
 * Routes intentionally excluded from the axe matrix: require state or OAuth handshakes that are not stable in CI.
 */
export const PAGES_DEFERRED = [
  {
    name: "Governance approval request lineage",
    path: "/governance/approval-requests/{id}/lineage",
    reason:
      "Lineage view expects a persisted approval request (e.g. Contoso demo `apr-demo-001`). Catalogs without demo governance seed return empty/error surfaces — flakes the `main` visibility gate. Scope as a targeted journey test once seed is mandatory.",
  },
  {
    name: "OAuth sign-in callback",
    path: "/auth/callback",
    reason:
      "Entra/OIDC callback requires `code` / `state` query parameters from the identity provider; loading the bare route yields a non-representative error shell for accessibility scoring.",
  },
  {
    name: "Finding detail (fixture run + mock-only finding slug)",
    path: `/architecture/reviews/${FIXTURE_RUN_ID}/findings/${FIXTURE_FINDING_ID}`,
    reason:
      "`FIXTURE_FINDING_ID` aligns with mock/breadcrumb fixtures; live SQL demos use human slugs (e.g. showcase `phi-minimization-risk`). Scanning this pair can 404 or show empty chrome on catalogs without that row — showcase finding routes already cover the inspect UI.",
  },
] as const;

/**
 * PR/extended route matrix scores light appearance. Demo tenants often sync
 * `archlucid_color_mode=dark` after hydration; pricing/signup also hide the theme toggle.
 * Dark contrast is covered by `live-api-accessibility-focus.spec.ts`.
 */
async function lockLightAppearanceForRouteAxe(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    const pinLight = (): void => {
      try {
        window.localStorage.setItem("archlucid_color_mode", "light");
      } catch {
        /* ignore quota / private mode */
      }

      document.documentElement.classList.remove("dark");
    };

    pinLight();

    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains("dark")) {
        pinLight();
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });
}

async function expectNoCriticalOrSeriousAxeViolations(page: Page, path: string) {
  await lockLightAppearanceForRouteAxe(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator("main").first().waitFor({ state: "visible", timeout: 90_000 });

  // Demo tenants can re-apply dark after hydration; re-pin light before the axe snapshot.
  await page.evaluate(() => {
    try {
      window.localStorage.setItem("archlucid_color_mode", "light");
    } catch {
      /* ignore */
    }

    document.documentElement.classList.remove("dark");
  });

  const results = await runAxe(page, { disableRules: axeLiveE2eDisableRuleIdsNow() });
  const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");

  expect(critical, formatViolations(critical)).toHaveLength(0);
}

test.describe(
  "accessibility baseline — WCAG 2.2 AA (PR route subset)",
  { tag: [liveA11yPrTag] },
  () => {
    for (const { name, path } of PAGES_LIVE_A11Y_PR) {
      test(`${name} (${path}) has no critical or serious axe violations`, async ({ page }) => {
        await expectNoCriticalOrSeriousAxeViolations(page, path);
      });
    }
  },
);

test.describe(
  "accessibility baseline — WCAG 2.2 AA (extended route matrix)",
  { tag: [liveA11yFullMatrixTag] },
  () => {
    for (const { name, path } of PAGES_LIVE_A11Y_EXTENDED) {
      test(`${name} (${path}) has no critical or serious axe violations`, async ({ page }) => {
        await expectNoCriticalOrSeriousAxeViolations(page, path);
      });
    }
  },
);
