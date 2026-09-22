import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";
import {
  REVIEW_SCORECARD_EMPTY_VALUE,
  REVIEW_SCORECARD_MEASURED_DETAIL,
  REVIEW_SCORECARD_MEASURED_ZERO_DETAIL,
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
    scopeNote: input.value === 0 ? REVIEW_SCORECARD_MEASURED_ZERO_DETAIL : REVIEW_SCORECARD_MEASURED_DETAIL,
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
    scopeNote: input.value === 0 ? REVIEW_SCORECARD_MEASURED_ZERO_DETAIL : REVIEW_SCORECARD_MEASURED_DETAIL,
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
    scopeNote: input.value === 0 ? REVIEW_SCORECARD_MEASURED_ZERO_DETAIL : input.scopeNote,
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
        scopeNote: REVIEW_SCORECARD_MEASURED_DETAIL,
        href: input.openFindingsHref,
      }),
    },
    {
      key: "risk-weighted-open",
      label: "Risk-weighted open",
      presentation: remediationFactoryDecimalMetricPresentation({
        value: metrics?.riskWeightedOpen,
        scopeNote: "Risk-weighted sum across open findings.",
      }),
    },
    {
      key: "critical-exposure",
      label: "Critical exposure",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.criticalExposureCount,
        scopeNote: "Findings tagged with critical exposure.",
      }),
    },
    {
      key: "net-burn",
      label: "Net burn (7d)",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.netBurn,
        scopeNote: "Created minus remediated in the last seven days.",
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
        scopeNote: "Share of open findings with exact pattern match coverage.",
      }),
    },
    {
      key: "automation",
      label: "Automation %",
      presentation: remediationFactoryPercentMetricPresentation({
        value: metrics?.automationPercent,
        scopeNote: "Share of open findings with automation-ready patterns.",
      }),
    },
    {
      key: "exceptions-active",
      label: "Exceptions active",
      presentation: remediationFactoryCountMetricPresentation({
        value: metrics?.exceptionsActive,
        scopeNote: "Active risk exceptions in workspace scope.",
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
        scopeNote: "Average age of open findings in days.",
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
