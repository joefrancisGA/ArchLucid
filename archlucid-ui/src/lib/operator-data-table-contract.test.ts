import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Marketing pages, help guides, and the static reference tables they embed are prose documents,
 * not operator data grids, so they are outside the EnterpriseTable convention.
 */
const EXEMPT_PREFIXES: readonly string[] = [
  "app/(marketing)/",
  "app/(operator)/help/",
  "components/help/",
  "components/marketing/",
];

/**
 * Operator surfaces still rendering raw `<table>` markup (TB-2382 ratchet baseline).
 *
 * `EnterpriseTable` owns the scroll shell, header-row treatment, cell padding, and row borders.
 * Hand-rolled tables re-derive those per surface — the fleet COGS grid used `py-2 pr-4` cells and
 * `border-neutral-100` rows against the shared `border-neutral-200`. This list may shrink but must
 * never grow.
 */
const RAW_TABLE_BASELINE: ReadonlySet<string> = new Set([
  "app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageCostBreakdownPanel.tsx",
  "app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageRecentActivityPanel.tsx",
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersCatalogTable.tsx",
  "app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard.tsx",
  "app/(operator)/administration/security-trust/_sections/OperatorSecurityTrustPageView.tsx",
  "app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx",
  "app/(operator)/governance/policy-packs/_sections/CuratedRulesAuthoringSection.tsx",
  "app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/AwsConnectionRecentActivityPanel.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/AwsTrustPolicyStarterPanel.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/GcpConnectionRecentActivityPanel.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/GcpWifStarterPanel.tsx",
  "app/(operator)/internal/configuration/_sections/AdminConfigurationPageView.tsx",
  "app/(operator)/internal/pricing-quote-aging/_sections/PricingQuoteAgingPageView.tsx",
  "app/(operator)/internal/product-learning/_sections/ProductLearningPageView.tsx",
  "app/(operator)/internal/recommendation-learning/_sections/RecommendationLearningOpsPageClient.tsx",
  "components/ArtifactListTable.tsx",
  "components/alerts/AlertSimulationContent.tsx",
  "components/compare/ArchitectureManifestUnifiedDiffView.tsx",
  "components/compare/StructuredComparisonView.tsx",
  "components/evolution/SimulationRunDiffCard.tsx",
  "components/governance/GovernanceConflictsTable.tsx",
  "components/planning/PlanningPlansTable.tsx",
  "components/planning/PlanningThemesTable.tsx",
  "components/provenance/ProvenancePageWorkspace.tsx",
  "components/replay/ReplayValidationHistorySection.tsx",
  "components/reviews/ReviewAgentExecutionLogSection.tsx",
  "components/runs/RunAgentForensicsSection.tsx",
  "components/runs/RunAgentQualityWarningsPanel.tsx",
  "components/runs/RunDecisionExplainabilitySection.tsx",
  "components/runs/RunRetrievalGroundingPanel.tsx",
  "components/runs/RunToolInvocationForensicsPanel.tsx",
  "components/runs/RunsListAggregateErrorBoundary.tsx",
  "components/skeletons/RunsListSkeleton.tsx",
]);

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
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

function rendersRawTable(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return /<table[\s>]/.test(source) && !/EnterpriseTable\b/.test(source);
}

describe("operator data tables (TB-2382)", () => {
  it("keeps raw table markup inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(rendersRawTable)
      .map(toPosixRelativePath)
      .filter((path) => !EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !RAW_TABLE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...RAW_TABLE_BASELINE]
      .filter((path) => !rendersRawTable(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
