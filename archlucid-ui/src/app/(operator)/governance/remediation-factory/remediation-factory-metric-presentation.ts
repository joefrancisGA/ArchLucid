import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";
import {
  REVIEW_SCORECARD_EMPTY_VALUE,
  REVIEW_SCORECARD_NOT_MEASURED_LABEL,
} from "@/lib/pilot-scorecard-present";

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
    displayValue: `${input.value}%`,
    scopeNote: input.scopeNote,
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

  return [
    {
      key: "open-findings",
      label: "Open findings",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.openFindings,
        scopeNote: "SecureNow findings that are still open.",
        href: input.openFindingsHref,
      }),
    },
    {
      key: "risk-weighted-open",
      label: "Risk-weighted open",
      presentation: remediationFactoryDecimalMetricPresentation({
        value: metrics?.riskWeightedOpen,
        scopeNote: "A weighted count of those open findings. Not a percentage.",
      }),
    },
    {
      key: "critical-exposure",
      label: "Critical exposure",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.criticalExposureCount,
        scopeNote: "Open findings marked critical.",
      }),
    },
    {
      key: "net-burn",
      label: "Net burn (7d)",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.netBurn,
        scopeNote: "Findings opened minus findings closed in seven days.",
      }),
      hint:
        metrics == null
          ? undefined
          : `Created ${metrics.createdThisWeek} · Remediated ${metrics.remediatedThisWeek}`,
    },
    {
      key: "pattern-exact-match",
      label: "Pattern ExactMatch %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.patternCoverageExactMatchPercent,
        scopeNote: "Share of open findings whose pattern matched exactly.",
      }),
    },
    {
      key: "automation",
      label: "Automation %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.automationPercent,
        scopeNote: "Share of open findings with an automated check.",
      }),
    },
    {
      key: "exceptions-active",
      label: "Exceptions active",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.exceptionsActive,
        scopeNote: "Risk exceptions still in force.",
      }),
      hint:
        metrics == null
          ? undefined
          : `${metrics.exceptionsExpiringSoon} expiring soon`,
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
