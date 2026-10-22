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

export const REMEDIATION_FACTORY_METRICS_MEASUREMENT_TITLE = "How these counts are measured" as const;

export const REMEDIATION_FACTORY_METRICS_MEASUREMENT_BODY =
  "Open findings uses the factory metrics count. The governance queue can count open rows differently. Risk-weighted open uses remediation prioritization rule IE15-priority-v1. Net burn is opened minus closed. It is not cloud spend." as const;

export const REMEDIATION_FACTORY_OPEN_FINDINGS_HELPER = "SecureNow findings that are still open." as const;

export const REMEDIATION_FACTORY_RISK_WEIGHTED_HELPER =
  "A weighted count of those open findings. Not a percentage." as const;

export const REMEDIATION_FACTORY_CRITICAL_EXPOSURE_HELPER = "Open findings marked critical." as const;

export const REMEDIATION_FACTORY_NET_BURN_HELPER =
  "Findings opened minus findings closed in seven days." as const;

export const REMEDIATION_FACTORY_PATTERN_EXACT_HELPER =
  "Share of open findings whose pattern matched exactly." as const;

export const REMEDIATION_FACTORY_AUTOMATION_HELPER =
  "Share of open findings with an automated check." as const;

export const REMEDIATION_FACTORY_EXCEPTIONS_HELPER = "Risk exceptions still in force." as const;

export const REMEDIATION_FACTORY_AVERAGE_AGE_HELPER = "Average age of the open findings, in days." as const;

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
  readonly plainScopeNote?: boolean;
}): RemediationFactoryMetricPresentation {
  if (input.value === null || input.value === undefined) {
    return {
      displayValue: REVIEW_SCORECARD_EMPTY_VALUE,
      scopeNote: REVIEW_SCORECARD_NOT_MEASURED_LABEL,
      state: "notMeasured",
    };
  }

  const scopeNote =
    input.plainScopeNote === true
      ? input.scopeNote
      : `${WORKSPACE_METRICS_SCOPE}. ${REMEDIATION_FACTORY_PERCENT_POPULATION_LINE} ${input.scopeNote}`;

  return {
    displayValue: formatRemediationFactoryPercentDisplay(input.value),
    scopeNote,
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
    scopeNote: REMEDIATION_FACTORY_OPEN_FINDINGS_HELPER,
    href: input.openFindingsHref,
  });

  return [
    {
      key: "open-findings",
      label: "Open findings",
      presentation: openFindingsPresentation,
    },
    {
      key: "risk-weighted-open",
      label: "Risk-weighted open",
      presentation: remediationFactoryDecimalMetricPresentation({
        value: metrics?.riskWeightedOpen,
        scopeNote: REMEDIATION_FACTORY_RISK_WEIGHTED_HELPER,
      }),
    },
    {
      key: "critical-exposure",
      label: "Critical exposure",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.criticalExposureCount,
        scopeNote: REMEDIATION_FACTORY_CRITICAL_EXPOSURE_HELPER,
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
        scopeNote: REMEDIATION_FACTORY_NET_BURN_HELPER,
      }),
    },
    {
      key: "pattern-exact-match",
      label: "Pattern ExactMatch %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.patternCoverageExactMatchPercent,
        scopeNote: REMEDIATION_FACTORY_PATTERN_EXACT_HELPER,
        plainScopeNote: true,
      }),
      hint: "Pattern keys appear in the priority queue when recorded — not a drill-through from this tile alone.",
    },
    {
      key: "automation",
      label: "Automation %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.automationPercent,
        scopeNote: REMEDIATION_FACTORY_AUTOMATION_HELPER,
        plainScopeNote: true,
      }),
    },
    {
      key: "exceptions-active",
      label: "Exceptions active",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.exceptionsActive,
        scopeNote: REMEDIATION_FACTORY_EXCEPTIONS_HELPER,
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
        scopeNote: REMEDIATION_FACTORY_AVERAGE_AGE_HELPER,
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
