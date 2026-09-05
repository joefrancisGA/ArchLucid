"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  formatOperatorHomeCompactMetricsLine,
  formatSetupReadinessLabel,
} from "@/lib/operator/operator-home-workspace-metrics";
import { deriveOperatorHomeTenantCountingSnapshot } from "@/lib/operator/operator-home-tenant-counting";
import {
  OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL,
  OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR,
} from "@/lib/operator/operator-home-approval-check-warning-copy";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type OperatorHomeWorkspaceMetricsStripProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly workingMode?: boolean;
};

const METRIC_CARD_CLASS =
  "min-w-0 flex-1 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900";

/** Compact KPI strip for populated workspaces. */
export function OperatorHomeWorkspaceMetricsStrip(
  props: OperatorHomeWorkspaceMetricsStripProps,
): React.JSX.Element | null {
  const readiness = useFinishSetupReadinessContext();
  const searchParams = useSearchParams();
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
      ? OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR
      : OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL;
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

  return (
    <section aria-label="Workspace summary" data-testid="operator-home-workspace-metrics-strip">
      <p className="sr-only">{compactLine}</p>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
        <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-active-reviews">
          <SelfDescribingMetricCount
            presentation={operatorHomeActiveReviewsPresentation(activeReviews)}
            testId="operator-home-metric-active-reviews-count"
          />
        </li>
        <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-finalized-packages">
          <SelfDescribingMetricCount
            presentation={operatorHomeFinalizedPackagesPresentation(finalizedPackages)}
            testId="operator-home-metric-finalized-packages-count"
          />
        </li>
        <li className={METRIC_CARD_CLASS} data-testid="operator-home-metric-open-findings">
          <SelfDescribingMetricCount
            presentation={workspaceOpenFindingsPresentation(findingsCount)}
            testId="operator-home-metric-open-findings-count"
          />
        </li>
        <li className={METRIC_CARD_CLASS} data-testid="operator-home-governance-warnings-metric">
          <SelfDescribingMetricCount
            presentation={warningsPresentation}
            testId="operator-home-governance-warnings-metric-count"
          />
        </li>
      </ul>
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
            className="font-medium text-al-text-primary no-underline hover:text-[var(--al-accent-link)]"
            aria-label={`Workspace setup: ${formatSetupReadinessLabel(readiness.readyCount, readiness.totalCount)}`}
          >
            Setup {readiness.readyCount}/{readiness.totalCount}
          </Link>
        </p>
      )}
    </section>
  );
}
