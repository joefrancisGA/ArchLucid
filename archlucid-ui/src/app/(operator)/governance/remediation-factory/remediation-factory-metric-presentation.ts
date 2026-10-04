import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";
import {
  formatRemediationFactoryPercentDisplay,
  REMEDIATION_FACTORY_PERCENT_POPULATION_LINE,
} from "@/lib/remediation-factory/remediation-factory-percent-format";
import {
  REVIEW_SCORECARD_EMPTY_VALUE,
  REVIEW_SCORECARD_NOT_MEASURED_LABEL,
} from "@/lib/pilot-scorecard-present";

const WORKSPACE_METRICS_SCOPE = "Operational security · this workspace";

export const REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE = "Executive remediation metrics" as const;

export const REMEDIATION_FACTORY_EXECUTIVE_METRICS_SCOPE =
  "Counts and percentages across open operational security findings in the current workspace scope." as const;

export type RemediationFactoryMetricState = "measured" | "measuredZero" | "notMeasured";

export type RemediationFactoryMetricPresentation = {
  readonly displayValue: string;
  readonly scopeNote: string;
  readonly state: RemediationFactoryMetricState;
  readonly href?: string;
};

export function remediationFactoryCountMetricPresentation(input: {
  readonly value: number | null | undefined;
  readonly scopeNote: string;
  readonly href?: string;
}): RemediationFactoryMetricPresentation {
  if (input.value === null || input.value === undefined) {
    return {
      displayValue: REVIEW_SCORECARD_EMPTY_VALUE,
      scopeNote: REVIEW_SCORECARD_NOT_MEASURED_LABEL,
      state: "notMeasured",
    };
  }

  return {
    displayValue: String(input.value),
    scopeNote: input.scopeNote,
    state: input.value === 0 ? "measuredZero" : "measured",
    href: input.href,
  };
}

export function remediationFactoryDecimalMetricPresentation(input: {
  readonly value: number | null | undefined;
  readonly fractionDigits?: number;
  readonly scopeNote: string;
}): RemediationFactoryMetricPresentation {
  if (input.value === null || input.value === undefined) {
    return {
      displayValue: REVIEW_SCORECARD_EMPTY_VALUE,
      scopeNote: REVIEW_SCORECARD_NOT_MEASURED_LABEL,
      state: "notMeasured",
    };
  }

  return {
    displayValue: input.value.toFixed(input.fractionDigits ?? 2),
    scopeNote: input.scopeNote,
    state: input.value === 0 ? "measuredZero" : "measured",
  };
}

export function remediationFactoryPercentMetricPresentation(input: {
  readonly value: number | null | undefined;
  readonly scopeNote: string;
}): RemediationFactoryMetricPresentation {
  if (input.value === null || input.value === undefined) {
    return {
      displayValue: REVIEW_SCORECARD_EMPTY_VALUE,
      scopeNote: REVIEW_SCORECARD_NOT_MEASURED_LABEL,
      state: "notMeasured",
    };
  }

  return {
    displayValue: formatRemediationFactoryPercentDisplay(input.value),
    scopeNote: `${WORKSPACE_METRICS_SCOPE}. ${REMEDIATION_FACTORY_PERCENT_POPULATION_LINE} ${input.scopeNote}`,
    state: input.value === 0 ? "measuredZero" : "measured",
  };
}

export function buildRemediationFactoryExecutiveMetricPresentations(input: {
  readonly metrics: RemediationFactoryMetrics | null | undefined;
  readonly openFindingsHref: string;
}): ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly presentation: RemediationFactoryMetricPresentation;
  readonly hint?: string;
}> {
  const metrics = input.metrics;

  const openFindingsPresentation = remediationFactoryCountMetricPresentation({
    value: metrics?.openFindings,
    scopeNote: `${WORKSPACE_METRICS_SCOPE}. SecureNow findings that are still open (factory metrics API).`,
    href: input.openFindingsHref,
  });

  return [
    {
      key: "open-findings",
      label: "Open findings",
      presentation: openFindingsPresentation,
      hint: "Governance findings queue may count open rows differently — compare only when both surfaces are loaded.",
    },
    {
      key: "risk-weighted-open",
      label: "Risk-weighted open",
      presentation: remediationFactoryDecimalMetricPresentation({
        value: metrics?.riskWeightedOpen,
        scopeNote: `${WORKSPACE_METRICS_SCOPE}. Weighted sum from prioritization rule IE15-priority-v1 — not a finding count or percentage.`,
      }),
    },
    {
      key: "critical-exposure",
      label: "Critical exposure",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.criticalExposureCount,
        scopeNote: `${WORKSPACE_METRICS_SCOPE}. Count from factory metrics — linked queue filter is critical-error severity and may differ.`,
        href: buildGovernanceFindingsQueueHref({ filter: "critical-error" }),
      }),
      hint:
        metrics?.criticalExposureCount === 0
          ? "No critical-or-error findings in this metric for the current scope."
          : undefined,
    },
    {
      key: "recurrence",
      label: "Recurrence (7d)",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.recurrenceCount,
        scopeNote: `${WORKSPACE_METRICS_SCOPE}. Findings that reopened after remediation in the rolling 7-day window.`,
      }),
    },
    {
      key: "net-burn",
      label: "Net burn (7d)",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.netBurn,
        scopeNote: `${WORKSPACE_METRICS_SCOPE}. Findings opened minus remediated in the rolling 7-day window — not cloud spend. Negative means more closed than opened.`,
      }),
      hint:
        metrics == null
          ? undefined
          : `7-day window · Created ${metrics.createdThisWeek} · Remediated ${metrics.remediatedThisWeek}`,
    },
    {
      key: "pattern-exact-match",
      label: "Pattern ExactMatch %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.patternCoverageExactMatchPercent,
        scopeNote: "Pattern key exact-match rate among open findings in this metric.",
      }),
      hint: "Pattern keys appear in the priority queue when recorded — not a drill-through from this tile alone.",
    },
    {
      key: "automation",
      label: "Automation %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.automationPercent,
        scopeNote: "Share of open findings with an automated check recorded in this metric.",
      }),
    },
    {
      key: "exceptions-active",
      label: "Exceptions active",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.exceptionsActive,
        scopeNote: `${WORKSPACE_METRICS_SCOPE}. Risk exceptions still in force (current snapshot, not 7-day window).`,
      }),
      hint:
        metrics == null
          ? undefined
          : `7-day window · ${metrics.exceptionsExpiringSoon} expiring soon`,
    },
    {
      key: "average-age",
      label: "Avg age (days)",
      presentation: remediationFactoryDecimalMetricPresentation({
        value: metrics?.averageAgeDays,
        fractionDigits: 1,
        scopeNote: "Average age of the open findings, in days.",
      }),
    },
  ];
}

export function formatArchitectOutcomeDeltaValue(value: number): string {
  if (value === 0) {
    return "No change";
  }

  return value > 0 ? `+${value}` : String(value);
}

export function architectOutcomeDeltaScopeNote(input: {
  readonly denominator: number | null | undefined;
  readonly populationLabel: string;
}): string {
  if (input.denominator === null || input.denominator === undefined) {
    return REVIEW_SCORECARD_NOT_MEASURED_LABEL;
  }

  return `${input.populationLabel}: ${input.denominator} resources in comparison scope`;
}

export function architectOutcomeMetricPresentation(input: {
  readonly value: number | null | undefined;
  readonly denominator: number | null | undefined;
  readonly populationLabel: string;
}): RemediationFactoryMetricPresentation {
  if (input.value === null || input.value === undefined) {
    return {
      displayValue: REVIEW_SCORECARD_EMPTY_VALUE,
      scopeNote: REVIEW_SCORECARD_NOT_MEASURED_LABEL,
      state: "notMeasured",
    };
  }

  return {
    displayValue: formatArchitectOutcomeDeltaValue(input.value),
    scopeNote: architectOutcomeDeltaScopeNote({
      denominator: input.denominator,
      populationLabel: input.populationLabel,
    }),
    state: input.value === 0 ? "measuredZero" : "measured",
  };
}
