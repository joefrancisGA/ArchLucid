"use client";

import { cn } from "@/lib/utils";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorOutboxDiagnosticsCard } from "@/components/OperatorOutboxDiagnosticsCard";
import { PageHeading } from "@/components/PageHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { AiUsageBudgetControlsPanel } from "./ai-usage/AiUsageBudgetControlsPanel";
import { AiUsageCostBreakdownPanel } from "./ai-usage/AiUsageCostBreakdownPanel";
import { AiUsageCostScopeHelp } from "./ai-usage/AiUsageCostScopeHelp";
import { AiUsageDailyUsagePanel } from "./ai-usage/AiUsageDailyUsagePanel";
import { AiUsageFiltersBar } from "./ai-usage/AiUsageFiltersBar";
import { AiUsageKpiRow } from "./ai-usage/AiUsageKpiRow";
import { AiUsageMonthlyBudgetPanel } from "./ai-usage/AiUsageMonthlyBudgetPanel";
import { AiUsageQuietEmptyPeriodPanel } from "./ai-usage/AiUsageQuietEmptyPeriodPanel";
import { AiUsageRecentActivityPanel } from "./ai-usage/AiUsageRecentActivityPanel";
import { isAiUsageQuietEmptyPeriod } from "./ai-usage/is-ai-usage-quiet-empty-period";
import { WorkspaceBudgetStatusCard } from "./ai-usage/WorkspaceBudgetStatusCard";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";

type Props = {
  readonly model: CostReportingSettingsPageViewModel;
};

function PageLoadingSkeleton() {
  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-3xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function CostReportingSettingsPageView(props: Props) {
  const m = props.model;

  if (m.surface === "demo") {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="AI usage and cost"
        description="In a connected tenant, administrators review estimated AI usage costs and budget utilization here."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return <PageLoadingSkeleton />;
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="cost-reporting-forbidden">
          This page requires workspace access (ReadAuthority). Sign in with a workspace-scoped account or API key.
        </p>
      </div>
    );
  }

  const data = m.data;
  const derived = m.derived;
  // Quiet empty period: no zeroed KPI / On track / empty-chart cockpit (TB-1217).
  const quietEmptyPeriod = isAiUsageQuietEmptyPeriod(derived, m.loading);

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="cost-reporting-page">
      <PageHeading
        navHref={AI_USAGE_SETTINGS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.aiUsage}
        description="Monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace."
        actions={<PageContextualHelpButton />}
      />
      <AiUsageBillingVocabularyRail currentSurfaceId="ai-usage" />
      <ModelGovernanceAiUsageVocabularyRail currentSurfaceId="ai-usage" />
{data?.isMocked === true ? (
        <p
          className={cn(
            "m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
          data-testid="cost-reporting-mock-banner"
        >
          Showing <strong>sample usage data</strong> for layout preview — connect a live tenant for actual reporting.
        </p>
      ) : null}

      {quietEmptyPeriod ? (
        <>
          <AiUsageQuietEmptyPeriodPanel
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            currency={derived.kpi.currency}
            canManageBudget={m.canManageBudget}
          />
          <WorkspaceBudgetStatusCard
            governance={derived.governance}
            state={derived.budgetState}
            remainingBudgetUsd={derived.kpi.remainingBudgetUsd}
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            usedAmountUsd={derived.kpi.usedThisMonthUsd}
          />
          <AiUsageCostScopeHelp />
          <AiUsageBudgetControlsPanel canManageBudget={m.canManageBudget} />
        </>
      ) : (
        <>
          <AiUsageKpiRow kpi={derived.kpi} loading={m.loading} />

          <AiUsageMonthlyBudgetPanel
            kpi={derived.kpi}
            paceStatus={derived.budgetPaceStatus}
            paceLabel={derived.budgetPaceLabel}
            warningThresholdPercent={derived.governance?.warningThresholdPercent ?? null}
            state={derived.budgetState}
            canManageBudget={m.canManageBudget}
            onRetry={() => void m.load()}
          />

          <WorkspaceBudgetStatusCard
            governance={derived.governance}
            state={derived.budgetState}
            remainingBudgetUsd={derived.kpi.remainingBudgetUsd}
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            usedAmountUsd={derived.kpi.usedThisMonthUsd}
          />

          <AiUsageBudgetControlsPanel canManageBudget={m.canManageBudget} />

          <AiUsageCostScopeHelp />

          {m.canViewBudgetDetails ? (
            <AiUsageFiltersBar
              filters={m.filters}
              adminDashboard={m.adminDashboard}
              onFiltersChange={(nextFilters) => {
                m.setFilters({ ...nextFilters, groupBy: m.filters.groupBy });
              }}
            />
          ) : null}

          <AiUsageDailyUsagePanel
            daily={data?.daily ?? []}
            currency={data?.currency ?? "USD"}
            state={derived.costReportingState}
            onRefresh={() => void m.load()}
          />

          <AiUsageCostBreakdownPanel
            rows={derived.breakdownRows}
            currency={derived.kpi.currency}
            groupBy={m.filters.groupBy}
            state={derived.costReportingState === "empty" && derived.breakdownRows.length === 0 ? "empty" : derived.costReportingState}
            onGroupByChange={(groupBy) => m.setFilters({ ...m.filters, groupBy })}
          />

          <AiUsageRecentActivityPanel
            rows={derived.activityRows}
            currency={derived.kpi.currency}
            state={derived.activityState}
            canExport={m.canManageBudget}
          />

          {m.showDetailedActivityLink ? (
            <details className="group" data-testid="ai-usage-detailed-activity-details">
              <summary className="cursor-pointer list-none">
                <span className={cn("font-medium text-al-text-secondary underline decoration-dotted underline-offset-2 hover:text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  View detailed AI activity
                </span>
              </summary>
              <div className="mt-4">
                <OperatorOutboxDiagnosticsCard />
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
