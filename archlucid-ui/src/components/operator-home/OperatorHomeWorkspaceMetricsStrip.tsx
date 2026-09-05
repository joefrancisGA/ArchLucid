"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

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
  readonly emphasizeCount?: boolean;
};

function MetricCounter(props: MetricCounterProps): React.JSX.Element {
  const emphasizeCount = props.emphasizeCount !== false;
  const content = (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={emphasizeCount ? OPERATOR_HOME_METRIC_COUNTER_VALUE : OPERATOR_HOME_METRIC_COUNTER_LABEL}
      >
        {props.count}
      </span>
      <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>{props.label}</span>
    </span>
  );

  if (props.href !== undefined) {
    return (
      <li>
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
      </li>
    );
  }

  return (
    <li data-testid={props.testId}>
      {content}
    </li>
  );
}

/** Compact horizontal KPI strip for populated workspaces. */
export function OperatorHomeWorkspaceMetricsStrip(
  props: OperatorHomeWorkspaceMetricsStripProps,
): React.JSX.Element | null {
  const readiness = useFinishSetupReadinessContext();
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
  const findingsLabel = `Open finding${findingsCount === 1 ? "" : "s"}`;
  const warningsLabel =
    warningsCount === 1
      ? OPERATOR_HOME_APPROVAL_CHECK_WARNING_SINGULAR
      : OPERATOR_HOME_APPROVAL_CHECK_WARNING_PLURAL;
  const hasPressureMetrics =
    activeReviews > 0 || finalizedPackages > 0 || findingsCount > 0 || warningsCount > 0;

  if (!hasPressureMetrics) {
    return null;
  }

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
      <ul
        className={cn(
          "m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 border-b border-neutral-200 py-3 dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.helper,
          "text-al-text-secondary",
        )}
      >
        <MetricCounter
          count={activeReviews}
          label={`Active review${activeReviews === 1 ? "" : "s"}`}
          href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
          ariaLabel={`${activeReviews} active review${activeReviews === 1 ? "" : "s"}`}
          testId="operator-home-metric-active-reviews"
          emphasizeCount={activeReviews > 0}
        />
        <MetricCounter
          count={finalizedPackages}
          label={`Finalized package${finalizedPackages === 1 ? "" : "s"}`}
          href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
          ariaLabel={`${finalizedPackages} finalized package${finalizedPackages === 1 ? "" : "s"}`}
          testId="operator-home-metric-finalized-packages"
          emphasizeCount={finalizedPackages > 0}
        />
        <MetricCounter
          count={findingsCount}
          label={findingsLabel}
          href={OPERATOR_HOME_OPEN_FINDINGS_HREF}
          ariaLabel={`${findingsCount} ${findingsLabel.toLowerCase()}`}
          testId="operator-home-metric-open-findings"
          emphasizeCount={findingsCount > 0}
        />
        <li>
          <OperatorHomeGovernanceWarningsMetricLink
            count={warningsCount}
            label={warningsLabel}
            emphasizeCount={warningsCount > 0}
          />
        </li>
        {props.workingMode === true ? null : readiness.phase === "loading" ? (
          <li data-testid="operator-home-metric-setup-readiness">
            <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>{setupLabel}</span>
          </li>
        ) : (
          <li>
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
          </li>
        )}
      </ul>
    </section>
  );
}
