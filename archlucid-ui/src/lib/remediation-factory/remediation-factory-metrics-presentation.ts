import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import {
  formatRemediationFactoryPercentDisplay,
  REMEDIATION_FACTORY_PERCENT_POPULATION_LINE,
} from "@/lib/remediation-factory/remediation-factory-percent-format";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";

export type RemediationFactoryMetricTile = {
  readonly id: string;
  readonly label: string;
  readonly scopeLine: string;
  readonly windowLine?: string;
  readonly ruleLine?: string;
  readonly value: string | null;
  readonly valueFootnote?: string | null;
  readonly href?: string;
};

const WORKSPACE_SCOPE = "Operational security · this workspace";
const METRICS_WINDOW = "Rolling 7-day window";
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
      windowLine: "Governance queue open filter — may differ from factory metrics API.",
      value: formatCount(metrics?.openFindings),
      href: openFindingsHref,
    },
    {
      id: "open-findings-factory",
      label: "Open findings (factory metrics)",
      scopeLine: WORKSPACE_SCOPE,
      ruleLine: PRIORITIZATION_RULE,
      valueFootnote: "Factory metrics API count — compare to queue only when both are loaded.",
      value: formatCount(metrics?.openFindings),
    },
    {
      id: "risk-weighted-open",
      label: "Risk-weighted open",
      scopeLine: WORKSPACE_SCOPE,
      ruleLine: `${PRIORITIZATION_RULE} · weighted sum, not a finding count`,
      value: formatDecimal(metrics?.riskWeightedOpen, 2),
    },
    {
      id: "critical-exposure",
      label: "Critical exposure",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: "Factory metric — linked queue uses critical-error filter and may differ.",
      valueFootnote:
        metrics?.criticalExposureCount === 0 ? "No critical-or-error findings in this metric." : null,
      value: formatCount(metrics?.criticalExposureCount),
      href: buildGovernanceFindingsQueueHref({ filter: "critical-error" }),
    },
    {
      id: "recurrence",
      label: "Recurrence (7d)",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: `${METRICS_WINDOW} · findings that reopened after remediation in this metric`,
      value: formatCount(metrics?.recurrenceCount),
    },
    {
      id: "net-burn",
      label: "Net burn (7d)",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: `${METRICS_WINDOW} · opened minus remediated — not cloud spend`,
      valueFootnote:
        metrics == null
          ? null
          : `Created ${metrics.createdThisWeek} · Remediated ${metrics.remediatedThisWeek}`,
      value: formatCount(metrics?.netBurn),
    },
    {
      id: "pattern-exact",
      label: "Pattern exact match %",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: REMEDIATION_FACTORY_PERCENT_POPULATION_LINE,
      value:
        metricsLoaded && metrics !== undefined
          ? formatRemediationFactoryPercentDisplay(metrics.patternCoverageExactMatchPercent)
          : null,
    },
    {
      id: "automation",
      label: "Automation %",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: REMEDIATION_FACTORY_PERCENT_POPULATION_LINE,
      value:
        metricsLoaded && metrics !== undefined
          ? formatRemediationFactoryPercentDisplay(metrics.automationPercent)
          : null,
    },
    {
      id: "exceptions-active",
      label: "Exceptions active",
      scopeLine: WORKSPACE_SCOPE,
      windowLine: "Current snapshot — not the 7-day window",
      valueFootnote:
        metrics == null ? null : `${METRICS_WINDOW} · ${metrics.exceptionsExpiringSoon} expiring soon`,
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
