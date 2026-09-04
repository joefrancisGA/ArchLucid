"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  deriveOperatorHomeWorkspaceMetrics,
  formatOperatorHomeCompactMetricsLine,
  formatSetupReadinessLabel,
} from "@/lib/operator/operator-home-workspace-metrics";
import { OperatorHomeGovernanceWarningsMetricLink } from "@/components/operator-home/OperatorHomeGovernanceWarningsMetricLink";
import {
  OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF,
  OPERATOR_HOME_OPEN_FINDINGS_HREF,
  OPERATOR_HOME_SETUP_READINESS_HREF,
} from "@/lib/operator/operator-home-metric-hrefs";
import {
  OPERATOR_HOME_METRIC_COUNTER_LABEL,
  OPERATOR_HOME_METRIC_COUNTER_VALUE,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

type OperatorHomeWorkspaceMetricsStripProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly workingMode?: boolean;
};

type MetricCounterProps = {
  readonly count: number;
  readonly label: string;
  readonly href?: string;
  readonly ariaLabel?: string;
  readonly testId?: string;
};

function MetricCounter(props: MetricCounterProps): React.JSX.Element {
  const content = (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={OPERATOR_HOME_METRIC_COUNTER_VALUE}>{props.count}</span>
      <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>{props.label}</span>
    </span>
  );

  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        className={cn(
          "rounded-sm no-underline transition-colors hover:text-[var(--al-accent-link)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
        )}
        aria-label={props.ariaLabel}
        data-testid={props.testId}
      >
        {content}
      </Link>
    );
  }

  return <div data-testid={props.testId}>{content}</div>;
}

/** Compact horizontal KPI strip for populated workspaces. */
export function OperatorHomeWorkspaceMetricsStrip(
  props: OperatorHomeWorkspaceMetricsStripProps,
): React.JSX.Element | null {
  const readiness = useFinishSetupReadinessContext();
  const metrics = deriveOperatorHomeWorkspaceMetrics(
    props.runsDashboard.items,
    props.runsDashboard.totalCount,
  );

  if (!metrics.hasReviews) {
    return null;
  }

  const activeReviews = metrics.reviewPackagesActive;
  const findingsCount = metrics.openFindings;
  const warningsCount = metrics.governanceWarnings;
  const findingsLabel = `Open finding${findingsCount === 1 ? "" : "s"}`;
  const warningsLabel = `Warning${warningsCount === 1 ? "" : "s"}`;
  const showActiveReviewsMetric = activeReviews !== 1;
  const setupLabel = readiness.phase === "loading"
    ? "Setup …"
    : `Setup ${readiness.readyCount}/${readiness.totalCount}`;
  const setupAriaLabel =
    readiness.phase === "loading"
      ? "Workspace setup readiness loading"
      : `Workspace setup: ${formatSetupReadinessLabel(readiness.readyCount, readiness.totalCount)}`;
  const compactLine = formatOperatorHomeCompactMetricsLine({
    metrics,
    setupReadyCount: readiness.readyCount,
    setupTotalCount: readiness.totalCount,
    setupReadinessLoading: readiness.phase === "loading",
  });

  return (
    <section aria-label="Workspace summary" data-testid="operator-home-workspace-metrics-strip">
      <p className="sr-only">{compactLine}</p>
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-neutral-200 py-3 dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.helper,
          "text-al-text-secondary",
        )}
        role="list"
      >
        {showActiveReviewsMetric ? (
          <MetricCounter
            count={activeReviews}
            label={`Active review${activeReviews === 1 ? "" : "s"}`}
            href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
            ariaLabel={`${activeReviews} active review${activeReviews === 1 ? "" : "s"}`}
            testId="operator-home-metric-active-reviews"
          />
        ) : null}
        <MetricCounter
          count={findingsCount}
          label={findingsLabel}
          href={OPERATOR_HOME_OPEN_FINDINGS_HREF}
          ariaLabel={`${findingsCount} ${findingsLabel.toLowerCase()}`}
          testId="operator-home-metric-open-findings"
        />
        <OperatorHomeGovernanceWarningsMetricLink
          count={warningsCount}
          label={warningsLabel}
        />
        {props.workingMode === true ? null : readiness.phase === "loading" ? (
          <div data-testid="operator-home-metric-setup-readiness">
            <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>{setupLabel}</span>
          </div>
        ) : (
          <Link
            href={OPERATOR_HOME_SETUP_READINESS_HREF}
            className={cn(
              "rounded-sm no-underline transition-colors hover:text-[var(--al-accent-link)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
            )}
            aria-label={setupAriaLabel}
            data-testid="operator-home-metric-setup-readiness"
          >
            <span className="inline-flex items-baseline gap-1.5">
              <span className={OPERATOR_HOME_METRIC_COUNTER_VALUE}>
                {readiness.readyCount}/{readiness.totalCount}
              </span>
              <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>Setup</span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
