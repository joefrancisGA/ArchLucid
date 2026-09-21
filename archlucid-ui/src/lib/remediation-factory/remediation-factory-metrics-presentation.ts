import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";

export type RemediationFactoryMetricTile = {
  readonly id: string;
  readonly label: string;
  readonly scopeLine: string;
  readonly windowLine?: string;
  readonly ruleLine?: string;
  readonly value: string | null;
  readonly href?: string;
};

const WORKSPACE_SCOPE = "Operational security · this workspace";
const METRICS_WINDOW = "Rolling 7-day window where noted";
const PRIORITIZATION_RULE = "Remediation prioritization rule IE15-priority-v1";

export function buildRemediationFactoryExecutiveMetricTiles(
  metrics: RemediationFactoryMetrics | undefined,
  metricsLoaded: boolean,
): readonly RemediationFactoryMetricTile[] {
  const openFindingsHref = buildGovernanceFindingsQueueHref({ filter: "open" });

  function formatCount(value: number | undefined): string | null {
    if (!metricsLoaded || metrics === undefined) {
      return null;
    }

    if (value === undefined) {
      return null;
    }

    return String(value);
  }

  function formatDecimal(value: number | undefined, digits = 2): string | null {
    if (!metricsLoaded || metrics === undefined || value === undefined) {
      return null;
    }

    return value.toFixed(digits);
  }

  return [
    {
      id: "open-findings-queue",
      label: "Open findings (queue)",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: "Current open operational findings",
      value: formatCount(metrics?.openFindings),
      href: openFindingsHref,
    },
    {
      id: "open-findings-factory",
      label: "Open findings (factory metrics)",
      scopeLine: WORKSPACE_SCOPE,
      ruleLine: PRIORITIZATION_RULE,
      value: formatCount(metrics?.openFindings),
    },
    {
      id: "risk-weighted-open",
      label: "Risk-weighted open",
      scopeLine: WORKSPACE_SCOPE,
      ruleLine: PRIORITIZATION_RULE,
      value: formatDecimal(metrics?.riskWeightedOpen, 2),
    },
    {
      id: "critical-exposure",
      label: "Critical exposure",
      scopeLine: WORKSPACE_SCOPE,
      value: formatCount(metrics?.criticalExposureCount),
      href: buildGovernanceFindingsQueueHref({ filter: "critical-error" }),
    },
    {
      id: "net-burn",
      label: "Net burn (7d)",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: METRICS_WINDOW,
      value: formatCount(metrics?.netBurn),
    },
    {
      id: "pattern-exact",
      label: "Pattern exact match %",
      scopeLine: WORKSPACE_SCOPE,
      value:
        metricsLoaded && metrics !== undefined ? `${metrics.patternCoverageExactMatchPercent}%` : null,
    },
    {
      id: "automation",
      label: "Automation %",
      scopeLine: WORKSPACE_SCOPE,
      value: metricsLoaded && metrics !== undefined ? `${metrics.automationPercent}%` : null,
    },
    {
      id: "exceptions-active",
      label: "Exceptions active",
      scopeLine: WORKSPACE_SCOPE,
      value: formatCount(metrics?.exceptionsActive),
    },
    {
      id: "avg-age",
      label: "Average age (days)",
      scopeLine: WORKSPACE_SCOPE,
      value: formatDecimal(metrics?.averageAgeDays, 1),
    },
  ];
}
