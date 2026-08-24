"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  deriveOperatorHomeWorkspaceMetrics,
  formatOperatorHomeCompactMetricsLine,
} from "@/lib/operator/operator-home-workspace-metrics";
import {
  OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF,
  OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF,
  OPERATOR_HOME_SETUP_READINESS_HREF,
} from "@/lib/operator/operator-home-metric-hrefs";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type OperatorHomeWorkspaceMetricsStripProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

type MetricTileProps = {
  readonly label: string;
  readonly href?: string;
};

function MetricTile(props: MetricTileProps): React.JSX.Element {
  const content = (
    <span className="font-medium text-al-text-primary tabular-nums">{props.label}</span>
  );

  return (
    <div className="min-w-0">
      {props.href !== undefined ? (
        <Link href={props.href} className={cn(OPERATOR_LINK.inline, "no-underline hover:underline")}>
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
  const setupLabel = readiness.phase === "loading"
    ? "Setup …"
    : `Setup ${readiness.readyCount}/${readiness.totalCount}`;
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
          "flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-neutral-200 py-3 dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.helper,
          "text-al-text-secondary",
        )}
      >
        <MetricTile
          label={`${activeReviews} Active review${activeReviews === 1 ? "" : "s"}`}
          href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
        />
        <MetricTile label={findingsLabel} />
        <MetricTile label={warningsLabel} href={OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF} />
        <MetricTile
          label={setupLabel}
          href={readiness.phase === "loading" ? undefined : OPERATOR_HOME_SETUP_READINESS_HREF}
        />
      </div>
    </section>
  );
}
