import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");
const OPERATOR_ROOT = join(SRC_ROOT, "app", "(operator)");

/**
 * Auth flow screens render inside `AuthFlowShell`, not the operator page shell, so they own their
 * own centred chrome and are outside this convention.
 */
const EXEMPT_PREFIXES: readonly string[] = ["app/(operator)/auth/"];

/**
 * Operator page views still hand-rolling a page title (TB-2377 ratchet baseline).
 *
 * Each of these picks its own title margin — `m-0`, `mt-0`, `mb-4`, or none — so vertical rhythm
 * above the first content block differs page to page. `OperatorPageHeader` owns that spacing plus
 * the subtitle measure, actions row, and bottom rule. This list may shrink but must never grow.
 */
const HAND_ROLLED_PAGE_TITLE_BASELINE: ReadonlySet<string> = new Set([
  "app/(operator)/_sections/OperatorHomePageSuspenseFallback.tsx",
  "app/(operator)/administration/api-keys/_sections/ApiKeysSettingsPageClient.tsx",
  "app/(operator)/administration/baseline/BaselineSettingsClient.tsx",
  "app/(operator)/administration/billing/OperatorBillingSettingsClient.tsx",
  "app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx",
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsRestrictedState.tsx",
  "app/(operator)/administration/tenant/_sections/TenantSettingsRestrictedState.tsx",
  "app/(operator)/administration/users/_sections/InviteReviewerPageView.tsx",
  "app/(operator)/architecture/digests/page.tsx",
  "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageFetchErrorView.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageMalformedResponseView.tsx",
  "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailWorkspaceChrome.tsx",
  "app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectView.tsx",
  "app/(operator)/architecture/reviews/[runId]/findings/[findingId]/_sections/FindingDetailPageView.tsx",
  "app/(operator)/architecture/reviews/[runId]/page.tsx",
  "app/(operator)/architecture/reviews/[runId]/print/_sections/PackagePrintPageView.tsx",
  "app/(operator)/demo/explain/_sections/DemoExplainPageView.tsx",
  "app/(operator)/governance/_sections/GovernanceWorkflowSuspenseFallback.tsx",
  "app/(operator)/governance/audit/page.tsx",
  "app/(operator)/governance/policy-packs/[id]/HealthcareClaimsPolicyPackDetail.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/_sections/ManifestDetailPageErrorViews.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/_sections/ManifestDetailPageView.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/artifacts/[artifactId]/loading.tsx",
  "app/(operator)/governance/signed-records/[manifestId]/loading.tsx",
  "app/(operator)/insights/architecture-scorecard/_sections/PilotScorecardPageView.tsx",
  "app/(operator)/insights/executive-summary/_sections/ValueReportPageView.tsx",
  "app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx",
  "app/(operator)/insights/roi-summary/_sections/RoiSummaryPageView.tsx",
  "app/(operator)/internal/configuration/_sections/AdminConfigurationPageView.tsx",
  "app/(operator)/internal/evidence-proposals/_sections/AdminEvidenceProposalsPageClient.tsx",
  "app/(operator)/internal/health/_sections/AdminHealthPageView.tsx",
  "app/(operator)/internal/integration-events/dlq/_sections/IntegrationEventsDlqPageClient.tsx",
  "app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient.tsx",
  "app/(operator)/internal/tenants/_sections/AdminTenantsPageClient.tsx",
]);

function collectPageViews(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectPageViews(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function handRollsPageTitle(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return /<h1[\s>]/.test(source) && /OPERATOR_TYPOGRAPHY\.pageTitle/.test(source);
}

describe("operator page chrome (TB-2377)", () => {
  it("keeps hand-rolled page titles inside the frozen baseline", () => {
    const offenders = collectPageViews(OPERATOR_ROOT)
      .filter(handRollsPageTitle)
      .map(toPosixRelativePath)
      .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !HAND_ROLLED_PAGE_TITLE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...HAND_ROLLED_PAGE_TITLE_BASELINE]
      .filter((path) => !handRollsPageTitle(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
