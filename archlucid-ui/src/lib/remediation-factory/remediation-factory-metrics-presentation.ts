import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import {
  formatRemediationFactoryPercentPoints,
  REMEDIATION_FACTORY_PERCENT_POPULATION_LINE,
} from "@/lib/remediation-factory/remediation-factory-percent-format";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";
import { parseFiniteNumber, parseNonNegativeFiniteNumber } from "@/lib/parse-finite-number";

export type RemediationFactoryMetricTile = {
  readonly id: string;
  readonly label: string;
  readonly scopeLine?: string;
  readonly windowLine?: string;
  readonly ruleLine?: string;
  readonly value: string | null;
  readonly valueFootnote?: string | null;
  readonly href?: string;
};

const WORKSPACE_SCOPE = "Operational security · this workspace";
const METRICS_WINDOW = "Rolling 7-day window";
const PRIORITIZATION_RULE = "Remediation prioritization rule IE15-priority-v1";


function netBurnWeeklyFootnoteWhenLoaded(
  metricsLoaded: boolean,
  metrics: RemediationFactoryMetrics | undefined,
): string | null {
  if (!metricsLoaded || metrics === undefined) {
    return null;
  }

  const created = parseNonNegativeFiniteNumber(metrics.createdThisWeek);
  const remediated = parseNonNegativeFiniteNumber(metrics.remediatedThisWeek);

  if (created === null || remediated === null || !Number.isInteger(created) || !Number.isInteger(remediated)) {
    return null;
  }

  return `Created ${created} · Remediated ${remediated}`;
}

function exceptionsExpiringFootnoteWhenLoaded(
  metricsLoaded: boolean,
  metrics: RemediationFactoryMetrics | undefined,
): string | null {
  if (!metricsLoaded || metrics === undefined) {
    return null;
  }

  const expiringSoon = parseNonNegativeFiniteNumber(metrics.exceptionsExpiringSoon);

  if (expiringSoon === null || !Number.isInteger(expiringSoon)) {
    return null;
  }

  return `${METRICS_WINDOW} · ${expiringSoon} expiring soon`;
}
export function buildRemediationFactoryExecutiveMetricTiles(
  metrics: RemediationFactoryMetrics | undefined,
  metricsLoaded: boolean,
): readonly RemediationFactoryMetricTile[] {
  const openFindingsHref = buildGovernanceFindingsQueueHref({ filter: "open" });
  const netBurn = metricsLoaded
    ? (() => {
        const normalized = parseFiniteNumber(metrics?.netBurn);

        if (normalized === null || !Number.isInteger(normalized)) {
          return null;
        }

        return normalized;
      })()
    : null;

  function formatCount(value: number | undefined): string | null {
    if (!metricsLoaded || metrics === undefined) {
      return null;
    }

    if (value === undefined) {
      return null;
    }

    const normalized = parseNonNegativeFiniteNumber(value);

    if (normalized === null || !Number.isInteger(normalized)) {
      return null;
    }

    return String(normalized);
  }

  function formatDecimal(value: number | undefined, digits = 2): string | null {
    if (!metricsLoaded || metrics === undefined || value === undefined) {
      return null;
    }

    const normalized = parseNonNegativeFiniteNumber(value);

    return normalized === null ? null : normalized.toFixed(digits);
  }


  function formatPercentPoints(value: number | undefined): string | null {
    if (!metricsLoaded || metrics === undefined || value === undefined) {
      return null;
    }

    const normalized = parseNonNegativeFiniteNumber(value);

    return normalized === null ? null : formatRemediationFactoryPercentPoints(normalized);
  }

  

  function metricTileChromeWhenLoaded(line: string): string | undefined {
    return metricsLoaded ? line : undefined;
  }

  function windowLineWhenLoaded(line: string): string | undefined {
    return metricTileChromeWhenLoaded(line);
  }

  function scopeLineWhenLoaded(line: string): string | undefined {
    return metricTileChromeWhenLoaded(line);
  }

  return [
    {
      id: "open-findings-queue",
      label: "Open findings (queue)",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(
        "Governance queue open filter — may differ from factory metrics API.",
      ),
      value: formatCount(metrics?.openFindings),
      href: openFindingsHref,
    },
    {
      id: "open-findings-factory",
      label: "Open findings (factory metrics)",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      ruleLine: metricsLoaded ? PRIORITIZATION_RULE : undefined,
      valueFootnote: metricsLoaded
        ? "Factory metrics API count — compare to queue only when both are loaded."
        : null,
      value: formatCount(metrics?.openFindings),
    },
    {
      id: "risk-weighted-open",
      label: "Risk-weighted open",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      ruleLine: metricsLoaded ? `${PRIORITIZATION_RULE} · weighted sum, not a finding count` : undefined,
      value: formatDecimal(metrics?.riskWeightedOpen, 2),
    },
    {
      id: "critical-exposure",
      label: "Critical exposure",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(
        "Factory metric — linked queue uses critical-error filter and may differ.",
      ),
      valueFootnote:
        !metricsLoaded || metrics == null
          ? null
          : metrics.criticalExposureCount === 0
            ? "No critical-or-error findings in this metric."
            : null,
      value: formatCount(metrics?.criticalExposureCount),
      href: buildGovernanceFindingsQueueHref({ filter: "critical-error" }),
    },
    {
      id: "recurrence",
      label: "Recurrence (7d)",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(
        `${METRICS_WINDOW} · findings that reopened after remediation in this metric`,
      ),
      value: formatCount(metrics?.recurrenceCount),
    },
    {
      id: "net-burn",
      label: "Net burn (7d)",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(
        `${METRICS_WINDOW} · opened minus remediated — not cloud spend`,
      ),
      valueFootnote:
        netBurn === null ? null : netBurnWeeklyFootnoteWhenLoaded(metricsLoaded, metrics),
      value: netBurn === null ? null : String(netBurn),
    },
    {
      id: "pattern-exact",
      label: "Pattern exact match %",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(REMEDIATION_FACTORY_PERCENT_POPULATION_LINE),
      value: formatPercentPoints(metrics?.patternCoverageExactMatchPercent),
    },
    {
      id: "automation",
      label: "Automation %",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded(REMEDIATION_FACTORY_PERCENT_POPULATION_LINE),
      value: formatPercentPoints(metrics?.automationPercent),
    },
    {
      id: "exceptions-active",
      label: "Exceptions active",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      windowLine: windowLineWhenLoaded("Current snapshot — not the 7-day window"),
      valueFootnote: exceptionsExpiringFootnoteWhenLoaded(metricsLoaded, metrics),
      value: formatCount(metrics?.exceptionsActive),
    },
    {
      id: "avg-age",
      label: "Average age (days)",
      scopeLine: scopeLineWhenLoaded(WORKSPACE_SCOPE),
      value: formatDecimal(metrics?.averageAgeDays, 1),
    },
  ];
}
