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
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type OperatorHomeWorkspaceMetricsStripProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly workingMode?: boolean;
};

type MetricTileProps = {
  readonly label: string;
  readonly href?: string;
  readonly ariaLabel?: string;
};

function MetricTile(props: MetricTileProps): React.JSX.Element {
  const content = (
    <span className="font-medium text-al-text-primary tabular-nums">{props.label}</span>
  );

  return (
    <div className="min-w-0">
      {props.href !== undefined ? (
        <Link
          href={props.href}
          className={OPERATOR_LINK.inline}
          aria-label={props.ariaLabel}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
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
  const findingsLabel = `${metrics.openFindings} Open finding${metrics.openFindings === 1 ? "" : "s"}`;
  const warningsLabel = `${metrics.governanceWarnings} Warning${metrics.governanceWarnings === 1 ? "" : "s"}`;
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
          "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 py-3 dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.helper,
          "text-al-text-secondary",
        )}
      >
        {showActiveReviewsMetric ? (
          <MetricTile
            label={`${activeReviews} Active review${activeReviews === 1 ? "" : "s"}`}
            href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
          />
        ) : null}
        <MetricTile label={findingsLabel} href={OPERATOR_HOME_OPEN_FINDINGS_HREF} />
        <div className="min-w-0">
          <OperatorHomeGovernanceWarningsMetricLink label={warningsLabel} />
        </div>
        {props.workingMode === true ? null : (
          <MetricTile
            label={setupLabel}
            href={readiness.phase === "loading" ? undefined : OPERATOR_HOME_SETUP_READINESS_HREF}
            ariaLabel={setupAriaLabel}
          />
        )}
      </div>
    </section>
  );
}
