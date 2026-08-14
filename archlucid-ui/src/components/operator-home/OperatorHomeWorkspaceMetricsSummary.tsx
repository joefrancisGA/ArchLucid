"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  deriveOperatorHomeWorkspaceMetrics,
  formatSetupReadinessLabel,
  OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY,
  type OperatorHomeWorkspaceMetricsSnapshot,
} from "@/lib/operator/operator-home-workspace-metrics";
import {
  OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF,
  OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF,
  OPERATOR_HOME_SETUP_READINESS_HREF,
} from "@/lib/operator/operator-home-metric-hrefs";
import { workspaceOpenFindingsPresentation } from "@/lib/metric-count-presentation";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

type OperatorHomeWorkspaceMetricsSummaryProps = {
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
  readonly setupReadyCount: number;
  readonly setupTotalCount: number;
  readonly setupReadinessLoading: boolean;
  /** Primary KPIs stay visible; secondary metrics render inside View details. */
  readonly variant?: "primary" | "secondary" | "hero-inline";
};

type MetricItemProps = {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly href?: string;
};

function MetricItem(props: MetricItemProps) {
  const hasHref = props.href !== undefined && props.href.length > 0;

  return (
    <div className="min-w-0">
      <dt className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>{props.label}</dt>
      <dd className={cn("m-0 mt-0.5", OPERATOR_TYPE_SCALE.body)}>
        {hasHref ? (
          <Link href={props.href!} className={cn("font-medium", OPERATOR_LINK.inline)}>
            {props.value}
          </Link>
        ) : typeof props.value === "string" || typeof props.value === "number" ? (
          <span className="font-medium text-neutral-800 dark:text-neutral-100">{props.value}</span>
        ) : (
          props.value
        )}
      </dd>
    </div>
  );
}

function buildReviewPackagesValue(metrics: OperatorHomeWorkspaceMetricsSnapshot): string {
  if (metrics.reviewPackagesCommitted > 0 || metrics.reviewPackagesActive > 0) {
    return `${metrics.reviewPackagesTotal} (${metrics.reviewPackagesCommitted} committed · ${metrics.reviewPackagesActive} active)`;
  }

  return String(metrics.reviewPackagesTotal);
}

/** Compact workspace metrics — primary KPIs are doors into findings / warnings / packages. */
export function OperatorHomeWorkspaceMetricsSummary(props: OperatorHomeWorkspaceMetricsSummaryProps) {
  const variant = props.variant ?? "primary";
  const metrics = deriveOperatorHomeWorkspaceMetrics(props.runsDashboard.items, props.runsDashboard.totalCount);
  const setupReadinessValue = props.setupReadinessLoading
    ? "…"
    : formatSetupReadinessLabel(props.setupReadyCount, props.setupTotalCount);

  // TB-1037: no zero KPI theater before the first review — one helper line only.
  if (!metrics.hasReviews) {
    if (variant === "secondary") {
      return (
        <div data-testid="operator-home-workspace-metrics-secondary">
          <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-1">
            <MetricItem
              label="Setup readiness"
              value={setupReadinessValue}
              href={OPERATOR_HOME_SETUP_READINESS_HREF}
            />
          </dl>
        </div>
      );
    }

    return (
      <div data-testid="operator-home-workspace-metrics-summary">
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPE_SCALE.helper)}
          data-testid="operator-home-workspace-metrics-empty-copy"
        >
          {OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY}
        </p>
      </div>
    );
  }

  if (variant === "hero-inline") {
    return (
      <div data-testid="operator-home-hero-kpi-strip" aria-label="Workspace summary">
        <dl className="m-0 flex flex-wrap gap-x-4 gap-y-2">
          <MetricItem
            label="Reviews"
            value={buildReviewPackagesValue(metrics)}
            href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
          />
          <MetricItem
            label="Open findings"
            value={
              <SelfDescribingMetricCount
                variant="inline"
                presentation={workspaceOpenFindingsPresentation(metrics.openFindings)}
                testId="operator-home-open-findings-metric"
              />
            }
          />
          <MetricItem
            label="Governance warnings"
            value={String(metrics.governanceWarnings)}
            href={OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF}
          />
          <MetricItem
            label="Setup readiness"
            value={setupReadinessValue}
            href={OPERATOR_HOME_SETUP_READINESS_HREF}
          />
        </dl>
      </div>
    );
  }

  if (variant === "secondary") {
    return (
      <div data-testid="operator-home-workspace-metrics-secondary">
        <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2">
          <MetricItem label="Evidence sources" value={String(metrics.evidenceSources)} />
        </dl>
      </div>
    );
  }

  return (
    <div data-testid="operator-home-workspace-metrics-summary">
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricItem
          label="Reviews"
          value={buildReviewPackagesValue(metrics)}
          href={OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF}
        />
        <MetricItem
          label="Open findings"
          value={
            <SelfDescribingMetricCount
              variant="inline"
              presentation={workspaceOpenFindingsPresentation(metrics.openFindings)}
              testId="operator-home-open-findings-metric"
            />
          }
        />
        <MetricItem
          label="Governance warnings"
          value={String(metrics.governanceWarnings)}
          href={OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF}
        />
        <MetricItem
          label="Setup readiness"
          value={setupReadinessValue}
          href={OPERATOR_HOME_SETUP_READINESS_HREF}
        />
      </dl>
    </div>
  );
}
