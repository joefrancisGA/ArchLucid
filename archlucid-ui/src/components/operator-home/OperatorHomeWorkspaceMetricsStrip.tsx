"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";

import { OperatorHomePrimaryAttentionLead } from "@/components/operator-home/OperatorHomePrimaryAttentionLead";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import {
  formatOperatorHomeCompactMetricsLine,
  formatSetupReadinessLabel,
} from "@/lib/operator/operator-home-workspace-metrics";
import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
import {
  OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL,
  OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_SINGULAR,
} from "@/lib/operator/operator-home-governance-approval-warning-copy";
import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import {
  OPERATOR_HOME_SETUP_READINESS_HREF,
} from "@/lib/operator/operator-home-metric-hrefs";
import {
  operatorHomeActiveReviewsPresentation,
  operatorHomeFinalizedPackagesPresentation,
  operatorHomeGovernanceWarningsPresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";
import { OPERATOR_HOME_SECTION_HEADING, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorHomeWorkspaceMetricsStripProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly workingMode?: boolean;
};

const METRIC_CARD_CLASS =
  "min-w-0 flex-1 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900";

const OPERATOR_HOME_WORKSPACE_METRICS_SECTION_TITLE = "Workspace summary";
const OPERATOR_HOME_WORKSPACE_METRICS_SCOPE_LABEL = "Scope:";
const OPERATOR_HOME_WORKSPACE_METRICS_SCOPE_VALUE =
  "Each tile states its partition inline · reviews inventory, findings queue, or governance approval warnings.";

const OPERATOR_HOME_AWAITING_APPROVAL_WARNINGS_CLARIFIER =
  "Awaiting approval counts reviews in the approval queue. Approval warnings count governance checks that need a sign-off before finalization.";

/** Compact KPI strip for populated workspaces. */
export function OperatorHomeWorkspaceMetricsStrip(
  props: OperatorHomeWorkspaceMetricsStripProps,
): React.JSX.Element | null {
  const readiness = useFinishSetupReadinessContext();
  const searchParams = useSearchParams();
  const scope = useOperatorScopeRecord();
  const { summaries } = useOperatorAttentionSummary();
  const awaitingApprovalCount =
    summaries.find((summary) => summary.partition === "awaiting-approval")?.totalCount ?? 0;
  const countingSnapshot = deriveOperatorHomeTenantCountingSnapshot({
    displayItems: props.runsDashboard.items,
    previewItems: props.runsDashboard.items,
  });
  const metrics = countingSnapshot.metrics;

  if (!metrics.hasReviews) {
    return null;
  }

  const activeReviews = metrics.reviewPackagesActive;
  const finalizedPackages = metrics.reviewPackagesCommitted;
  const findingsCount = metrics.openFindings;
  const warningsCount = metrics.governanceWarnings;
  const warningsLabel =
    warningsCount === 1
      ? OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_SINGULAR
      : OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL;
  const hasPressureMetrics =
    activeReviews > 0 || finalizedPackages > 0 || findingsCount > 0 || warningsCount > 0;

  if (!hasPressureMetrics) {
    return null;
  }

  const warningsFilterActive = homeGovernanceWarningsQueryEnabled(searchParams);
  const warningsHref = warningsFilterActive
    ? homeGovernanceWarningsClearHrefFromSearch(searchParams.toString())
    : homeGovernanceWarningsHrefFromSearch(searchParams.toString());
  const warningsPresentation = {
    ...operatorHomeGovernanceWarningsPresentation(warningsCount, warningsLabel),
    href: warningsHref,
  };

  const compactLine = formatOperatorHomeCompactMetricsLine({
    metrics,
    setupReadyCount: readiness.readyCount,
    setupTotalCount: readiness.totalCount,
    setupReadinessLoading: readiness.phase === "loading",
  });

  const workspaceName = scope?.workspaceLabel?.trim() ?? "this workspace";

  return (
    <section aria-label={OPERATOR_HOME_WORKSPACE_METRICS_SECTION_TITLE} data-testid="operator-home-workspace-metrics-strip">
      <div className="mb-3 space-y-1">
        <h2 className={OPERATOR_HOME_SECTION_HEADING}>{OPERATOR_HOME_WORKSPACE_METRICS_SECTION_TITLE}</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{OPERATOR_HOME_WORKSPACE_METRICS_SCOPE_LABEL}</span>{" "}
          {OPERATOR_HOME_WORKSPACE_METRICS_SCOPE_VALUE}
          <span className="sr-only"> Workspace: {workspaceName}.</span>
        </p>
      </div>
      <p className="sr-only">{compactLine}</p>
      <div className="space-y-4" data-testid="operator-home-workspace-metrics-stack">
        <OperatorHomePrimaryAttentionLead />
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
          <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-active-reviews">
            <SelfDescribingMetricCount
              presentation={operatorHomeActiveReviewsPresentation(activeReviews)}
              testId="operator-home-metric-active-reviews-count"
              valueVariant={activeReviews === 0 ? "quiet" : "default"}
            />
          </li>
          <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-finalized-packages">
            <SelfDescribingMetricCount
              presentation={operatorHomeFinalizedPackagesPresentation(finalizedPackages)}
              testId="operator-home-metric-finalized-packages-count"
              valueVariant={finalizedPackages === 0 ? "quiet" : "default"}
            />
          </li>
          <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-open-findings">
            <SelfDescribingMetricCount
              presentation={workspaceOpenFindingsPresentation(findingsCount)}
              testId="operator-home-metric-open-findings-count"
              valueVariant={findingsCount === 0 ? "quiet" : "default"}
            />
          </li>
          <li className={METRIC_CARD_CLASS} data-testid="operator-home-governance-warnings-metric">
            <SelfDescribingMetricCount
              presentation={warningsPresentation}
              testId="operator-home-governance-warnings-metric-count"
              valueVariant={warningsCount === 0 ? "quiet" : "default"}
            />
          </li>
        </ul>
      </div>
      {warningsCount === 0 && awaitingApprovalCount > 0 ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="operator-home-awaiting-approval-warnings-clarifier"
        >
          {OPERATOR_HOME_AWAITING_APPROVAL_WARNINGS_CLARIFIER}
        </p>
      ) : null}
      {warningsCount > 0 ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <InlineGlossaryChip nounId="governance-approval" pulseOnFirstEncounter>
            {warningsCount === 1
              ? OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_SINGULAR
              : OPERATOR_HOME_GOVERNANCE_APPROVAL_WARNING_PLURAL}
          </InlineGlossaryChip>{" "}
          flag reviews that need a human sign-off before finalization.
        </p>
      ) : null}
      {props.workingMode === true ? null : readiness.phase === "loading" ? (
        <p
          className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}
          data-testid="operator-home-metric-setup-readiness"
        >
          Setup …
        </p>
      ) : (
        <p className="m-0 mt-3" data-testid="operator-home-metric-setup-readiness">
          <Link
            href={OPERATOR_HOME_SETUP_READINESS_HREF}
            className={cn("font-medium", OPERATOR_LINK.nav)}
            aria-label={`Workspace setup: ${formatSetupReadinessLabel(readiness.readyCount, readiness.totalCount)}`}
          >
            Setup {readiness.readyCount}/{readiness.totalCount}
          </Link>
        </p>
      )}
    </section>
  );
}
