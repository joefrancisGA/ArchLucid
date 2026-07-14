"use client";

import { cn } from "@/lib/utils";

import {
  deriveOperatorHomeWorkspaceMetrics,
  formatSetupReadinessLabel,
  OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY,
  type OperatorHomeWorkspaceMetricsSnapshot,
} from "@/lib/operator-home-workspace-metrics";
import { OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

type OperatorHomeWorkspaceMetricsSummaryProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly setupReadyCount: number;
  readonly setupTotalCount: number;
  readonly setupReadinessLoading: boolean;
};

type MetricItemProps = {
  readonly label: string;
  readonly value: string;
};

function MetricItem(props: MetricItemProps) {
  return (
    <div className="min-w-0">
      <dt className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>{props.label}</dt>
      <dd className={cn("m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPE_SCALE.body)}>
        {props.value}
      </dd>
    </div>
  );
}

function buildReviewPackagesValue(metrics: OperatorHomeWorkspaceMetricsSnapshot): string {
  if (!metrics.hasReviews) {
    return "0";
  }

  if (metrics.reviewPackagesCommitted > 0 || metrics.reviewPackagesActive > 0) {
    return `${metrics.reviewPackagesTotal} (${metrics.reviewPackagesCommitted} committed · ${metrics.reviewPackagesActive} active)`;
  }

  return String(metrics.reviewPackagesTotal);
}

/** Compact always-visible workspace metrics row for operator home. */
export function OperatorHomeWorkspaceMetricsSummary(props: OperatorHomeWorkspaceMetricsSummaryProps) {
  const metrics = deriveOperatorHomeWorkspaceMetrics(props.runsDashboard.items, props.runsDashboard.totalCount);
  const setupReadinessValue = props.setupReadinessLoading
    ? "…"
    : formatSetupReadinessLabel(props.setupReadyCount, props.setupTotalCount);

  return (
    <div data-testid="operator-home-workspace-metrics-summary">
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
        <MetricItem label="Reviews" value={buildReviewPackagesValue(metrics)} />
        <MetricItem label="Open findings" value={String(metrics.openFindings)} />
        <MetricItem label="Governance warnings" value={String(metrics.governanceWarnings)} />
        <MetricItem label="Evidence sources" value={String(metrics.evidenceSources)} />
        <MetricItem label="Setup readiness" value={setupReadinessValue} />
      </dl>

      {!metrics.hasReviews ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPE_SCALE.helper)}
          data-testid="operator-home-workspace-metrics-empty-copy"
        >
          {OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY}
        </p>
      ) : null}
    </div>
  );
}
