"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import { ModelGovernanceAiUsageVocabularyRail } from "@/components/ModelGovernanceAiUsageVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorOutboxDiagnosticsCard } from "@/components/operator/OperatorOutboxDiagnosticsCard";
import { PageHeading } from "@/components/PageHeading";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AiUsageSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { AI_USAGE_HELP_TOPIC_LABEL } from "@/lib/ai-usage-settings-evidence-copy";
import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { formatAiUsageEstimatesAsOfLabel } from "@/lib/ai-usage-dashboard-model";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { useAiUsageRouteShellState } from "./ai-usage-route-shell-context";

import { AiUsageBudgetControlsPanel } from "./ai-usage/AiUsageBudgetControlsPanel";
import { AiUsageCostBreakdownPanel } from "./ai-usage/AiUsageCostBreakdownPanel";
import { AiUsageCostScopeHelp, AiUsageEstimateHonestyLine } from "./ai-usage/AiUsageCostScopeHelp";
import { AiUsageDailyUsagePanel } from "./ai-usage/AiUsageDailyUsagePanel";
import { AiUsageFiltersBar } from "./ai-usage/AiUsageFiltersBar";
import { AiUsageKpiRow } from "./ai-usage/AiUsageKpiRow";
import { AiUsageMonthlyBudgetPanel } from "./ai-usage/AiUsageMonthlyBudgetPanel";
import { AiUsageQuietEmptyPeriodPanel } from "./ai-usage/AiUsageQuietEmptyPeriodPanel";
import { AiUsageRecentActivityPanel } from "./ai-usage/AiUsageRecentActivityPanel";
import { AiUsageSectionState } from "./ai-usage/AiUsageSectionState";
import { isAiUsageQuietEmptyPeriod } from "./ai-usage/is-ai-usage-quiet-empty-period";
import { WorkspaceBudgetStatusCard } from "./ai-usage/WorkspaceBudgetStatusCard";
import type { CostReportingSettingsPageViewModel } from "./cost-reporting-settings-page-view-model";

type Props = {
  readonly model: CostReportingSettingsPageViewModel;
};

function PageLoadingSkeleton() {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cost-reporting-page">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full max-w-3xl" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </OperatorPageContainer>
  );
}

export function CostReportingSettingsPageView(props: Props) {
  const m = props.model;
  const aiUsageShell = useAiUsageRouteShellState();
  const quietEmptyPeriod =
    m.surface === "granted" && isAiUsageQuietEmptyPeriod(m.derived, m.loading);

  useEffect(() => {
    if (m.surface !== "granted") {
      return undefined;
    }

    aiUsageShell?.setQuietEmptyPeriod(quietEmptyPeriod);

    return () => {
      aiUsageShell?.setQuietEmptyPeriod(false);
    };
  }, [aiUsageShell, m.surface, quietEmptyPeriod]);

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
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cost-reporting-page">
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="cost-reporting-forbidden">
          This page requires workspace access (ReadAuthority). Sign in with a workspace-scoped account or API key.
        </p>
      </OperatorPageContainer>
    );
  }

  const data = m.data;
  const derived = m.derived;
  const estimatesAsOfLabel =
    derived.freshness.estimatesAsOfUtc !== null
      ? formatAiUsageEstimatesAsOfLabel(derived.freshness.estimatesAsOfUtc)
      : null;
  const pageLoadFailed = derived.costReportingState === "error" && !m.loading;

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cost-reporting-page">
      <PageHeading
        navHref={AI_USAGE_SETTINGS_PATH}
        title={OPERATOR_NAV_LINK_LABELS.aiUsage}
        description="Monitor estimated AI spend, remaining budget, and the workflows driving cost for this workspace."
        metadata={
          estimatesAsOfLabel !== null ? (
            <span data-testid="ai-usage-estimates-as-of">{estimatesAsOfLabel}</span>
          ) : null
        }
        actions={<PageContextualHelpButton triggerText={AI_USAGE_HELP_TOPIC_LABEL} />}
      />
      <AiUsageSettingsEvidenceOrientationStrip />
      <AiUsageEstimateHonestyLine />
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

      {pageLoadFailed ? (
        <div data-testid="cost-reporting-page-error">
          <AiUsageSectionState
            state="error"
            title="AI usage"
            errorMessage="Could not load AI usage data. The request timed out or was interrupted."
            onRetry={() => void m.load({ forceRefresh: true })}
          />
        </div>
      ) : quietEmptyPeriod ? (
        <>
          <AiUsageQuietEmptyPeriodPanel
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            currency={derived.kpi.currency}
            canManageBudget={m.canManageBudget}
            billingPeriodResetLabel={derived.freshness.billingPeriodResetLabel}
          />
          <WorkspaceBudgetStatusCard
            governance={derived.governance}
            state={derived.budgetState}
            remainingBudgetUsd={derived.kpi.remainingBudgetUsd}
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            usedAmountUsd={derived.kpi.usedThisMonthUsd}
            onRetry={() => void m.load({ forceRefresh: true })}
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
            onRetry={() => void m.load({ forceRefresh: true })}
          />

          <WorkspaceBudgetStatusCard
            governance={derived.governance}
            state={derived.budgetState}
            remainingBudgetUsd={derived.kpi.remainingBudgetUsd}
            budgetTotalUsd={derived.kpi.budgetTotalUsd}
            usedAmountUsd={derived.kpi.usedThisMonthUsd}
            onRetry={() => void m.load({ forceRefresh: true })}
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
          ) : (
            <section
              id="ai-usage-filters-bar"
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid="ai-usage-filters-bar-restricted"
              aria-label="AI usage filters"
            >
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Workflow filters require execute workspace access.
              </p>
            </section>
          )}

          <AiUsageDailyUsagePanel
            daily={data?.daily ?? []}
            currency={data?.currency ?? "USD"}
            state={derived.costReportingState}
            onRefresh={() => void m.load({ forceRefresh: true })}
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
    </OperatorPageContainer>
  );
}
