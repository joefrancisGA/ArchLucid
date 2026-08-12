import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const TB_2144_QUERY_SURFACES = [
  "src/app/(operator)/administration/billing/OperatorBillingPaymentPastDueBanner.tsx",
  "src/components/alerts/AlertsOutstandingNavBadge.tsx",
  "src/components/governance/GovernanceReviewsAwaitingNavBadge.tsx",
  "src/components/llm/LlmBudgetStatusPill.tsx",
  "src/components/llm/LlmBudgetUtilizationMeter.tsx",
  "src/components/llm/LlmCostCommandCenterSummaryCard.tsx",
  "src/components/llm/LlmUsageBandHint.tsx",
  "src/components/governance/ServiceBusHealthBanner.tsx",
  "src/components/tenancy/TenantMigrationMaintenanceBanner.tsx",
  "src/components/operator/OperatorStickinessSnapshotCard.tsx",
] as const;

describe("operator billing and alerts nav query migration (TB-2144)", () => {
  it.each(TB_2144_QUERY_SURFACES)("does not use imperative mount fetch in %s", (relativePath) => {
    const source = readFileSync(join(repoRoot, relativePath), "utf8");

    expect(source).not.toContain("useEffect(");
    expect(source).toMatch(
      /useBillingSubscriptionStatusQuery|useAlertsInboxSummaryQuery|useGovernanceReviewsAwaitingActionQuery|useLlmMonthlyBudgetStatusQuery|useHealthReadySummaryQuery|useTenantCatalogMigrationStatusQuery|useOperatorStickinessSnapshotQuery/,
    );
  });
});
