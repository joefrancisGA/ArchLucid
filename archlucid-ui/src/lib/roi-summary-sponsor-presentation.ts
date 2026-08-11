import {
  DEFAULT_LOADED_HOURLY_USD,
  HOURS_PER_CRITICAL,
  HOURS_PER_HIGH,
  HOURS_PER_MEDIUM,
  HOURS_PER_PRECOMMIT_BLOCK,
  formatHours,
  formatUsd,
  hoursSurfaced,
} from "@/lib/roi-assumptions";
import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive-summary-pilot-roi-measurement-help";
import type { PilotValueReportJson, PilotValueReportSeverityJson } from "@/types/pilot-value-report";

export const ROI_SUMMARY_METHODOLOGY_HELP_HREF = EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

export const ROI_SUMMARY_PAGE_SUBTITLE =
  "Estimate review-time savings from finalized findings, governance blocks, and avoided rework.";

const SPONSOR_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export type RoiSummaryConfidenceLevel = "insufficient" | "low" | "moderate" | "good";

export type RoiSummaryConfidence = {
  readonly level: RoiSummaryConfidenceLevel;
  readonly label: string;
  readonly completenessLabel: string;
};

export type RoiSummaryDataNeed = {
  readonly label: string;
  readonly met: boolean;
};

export type RoiSummaryPeriodInput = {
  readonly report: Pick<PilotValueReportJson, "fromUtc" | "toUtc" | "totalRunsCommitted" | "findingsBySeverity">;
  readonly blocks: { readonly count: number; readonly exact: boolean };
};

export type RoiSummaryPeriodMetrics = {
  readonly hours: number;
  readonly findingsCounted: number;
  readonly blocksCounted: number;
  readonly usdEstimate: number;
  readonly showUsdEstimate: boolean;
  readonly confidence: RoiSummaryConfidence;
};

export function formatRoiSummarySponsorDate(isoUtc: string): string {
  const parsed = new Date(isoUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return SPONSOR_DATE.format(parsed);
}

export function formatRoiSummaryExclusiveEndDate(isoUtc: string): string {
  const parsed = new Date(isoUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  parsed.setUTCDate(parsed.getUTCDate() - 1);

  return SPONSOR_DATE.format(parsed);
}

export function isRoiSummaryPeriodCurrent(isoToUtcExclusive: string): boolean {
  const toDay = isoToUtcExclusive.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return toDay >= today;
}

export function formatRoiSummaryWindowRange(
  window: "rolling30" | "pilotToDate",
  fromUtc: string,
  toUtc: string,
): string {
  const from = formatRoiSummarySponsorDate(fromUtc);

  if (window === "pilotToDate" && isRoiSummaryPeriodCurrent(toUtc)) {
    return `${from} – present`;
  }

  const to = formatRoiSummaryExclusiveEndDate(toUtc);

  return `${from} – ${to}`;
}

export function formatRoiSummaryWindowTitle(
  window: "rolling30" | "pilotToDate",
  fromUtc: string,
  toUtc: string,
): string {
  const range = formatRoiSummaryWindowRange(window, fromUtc, toUtc);

  if (window === "rolling30") {
    return `Rolling 30 days: ${range}`;
  }

  return `Since pilot start: ${range}`;
}

export function countRoiSummaryFindings(severity: Pick<PilotValueReportSeverityJson, "critical" | "high" | "medium">): number {
  const critical = Number.isFinite(severity.critical) ? severity.critical : 0;
  const high = Number.isFinite(severity.high) ? severity.high : 0;
  const medium = Number.isFinite(severity.medium) ? severity.medium : 0;

  return critical + high + medium;
}

export function roiSummaryMethodologyFormula(): string {
  return `${HOURS_PER_CRITICAL}×Critical + ${HOURS_PER_HIGH}×High + ${HOURS_PER_MEDIUM}×Medium + ${HOURS_PER_PRECOMMIT_BLOCK}×governance blocks`;
}

export function deriveRoiSummaryConfidence(input: RoiSummaryPeriodInput): RoiSummaryConfidence {
  const findingsCounted = countRoiSummaryFindings(input.report.findingsBySeverity);
  const blocksCounted = Number.isFinite(input.blocks.count) ? Math.max(0, input.blocks.count) : 0;
  const committedReviews = Number.isFinite(input.report.totalRunsCommitted)
    ? Math.max(0, input.report.totalRunsCommitted)
    : 0;
  const hours = hoursSurfaced({
    critical: input.report.findingsBySeverity.critical,
    high: input.report.findingsBySeverity.high,
    medium: input.report.findingsBySeverity.medium,
    precommitBlocks: blocksCounted,
  });

  if (committedReviews === 0 && findingsCounted === 0 && blocksCounted === 0) {
    return {
      level: "insufficient",
      label: "Insufficient data",
      completenessLabel: "No finalized reviews in this period yet",
    };
  }

  if (hours <= 1e-9) {
    return {
      level: "low",
      label: "Low confidence",
      completenessLabel: "Findings or governance signals are still sparse",
    };
  }

  if (committedReviews === 0 || findingsCounted === 0) {
    return {
      level: "moderate",
      label: "Moderate confidence",
      completenessLabel: "Partial inputs — more finalized reviews will sharpen the estimate",
    };
  }

  return {
    level: "good",
    label: "Good confidence",
    completenessLabel: "Finalized findings and governance signals in period",
  };
}

export function deriveRoiSummaryDataNeeds(
  input: RoiSummaryPeriodInput,
  hourlyUsd: number,
): readonly RoiSummaryDataNeed[] {
  const findingsCounted = countRoiSummaryFindings(input.report.findingsBySeverity);
  const blocksCounted = Number.isFinite(input.blocks.count) ? Math.max(0, input.blocks.count) : 0;
  const committedReviews = Number.isFinite(input.report.totalRunsCommitted)
    ? Math.max(0, input.report.totalRunsCommitted)
    : 0;
  const hours = hoursSurfaced({
    critical: input.report.findingsBySeverity.critical,
    high: input.report.findingsBySeverity.high,
    medium: input.report.findingsBySeverity.medium,
    precommitBlocks: blocksCounted,
  });
  const hasHourlyCost = Number.isFinite(hourlyUsd) && hourlyUsd > 0;

  return [
    {
      label: "At least one finalized review",
      met: committedReviews > 0,
    },
    {
      label: "Findings with severity",
      met: findingsCounted > 0,
    },
    {
      label: "Governance block or review-time baseline",
      met: blocksCounted > 0 || hours > 1e-9,
    },
    {
      label: "Loaded hourly cost",
      met: hasHourlyCost,
    },
  ];
}

export function computeRoiSummaryPeriodMetrics(
  input: RoiSummaryPeriodInput,
  hourlyUsd: number,
): RoiSummaryPeriodMetrics {
  const blocksCounted = Number.isFinite(input.blocks.count) ? Math.max(0, input.blocks.count) : 0;
  const hours = hoursSurfaced({
    critical: input.report.findingsBySeverity.critical,
    high: input.report.findingsBySeverity.high,
    medium: input.report.findingsBySeverity.medium,
    precommitBlocks: blocksCounted,
  });
  const usdEstimate = hours * hourlyUsd;
  const showUsdEstimate = hours > 1e-9 && Number.isFinite(usdEstimate) && usdEstimate >= 0.5;

  return {
    hours,
    findingsCounted: countRoiSummaryFindings(input.report.findingsBySeverity),
    blocksCounted,
    usdEstimate,
    showUsdEstimate,
    confidence: deriveRoiSummaryConfidence(input),
  };
}

export function formatRoiSummaryHoursDisplay(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 1e-9) {
    return "—";
  }

  return formatHours(hours);
}

export function formatRoiSummaryUsdDisplay(hours: number, usdEstimate: number, showUsdEstimate: boolean): string {
  if (!showUsdEstimate) {
    return "—";
  }

  return formatUsd(usdEstimate);
}

export type RoiSummaryRateBasis = "buyer-provided" | "default-assumption" | "demo-derived";

export type RoiSummaryUsdWithRateBasis = {
  readonly display: string;
  readonly rateBasis: RoiSummaryRateBasis;
  readonly rateBasisLabel: string;
};

/** Formats sponsor-facing USD with an explicit loaded-hourly rate basis label. */
export function formatRoiSummaryUsdWithRateBasis(
  hours: number,
  usdEstimate: number,
  showUsdEstimate: boolean,
  options: { readonly isDefaultRate: boolean; readonly demoDerived?: boolean },
): RoiSummaryUsdWithRateBasis {
  if (!showUsdEstimate) {
    return {
      display: "—",
      rateBasis: options.demoDerived === true ? "demo-derived" : "default-assumption",
      rateBasisLabel: "No dollar estimate in this period",
    };
  }

  const rateBasis: RoiSummaryRateBasis =
    options.demoDerived === true
      ? "demo-derived"
      : options.isDefaultRate
        ? "default-assumption"
        : "buyer-provided";

  const rateBasisLabel =
    rateBasis === "demo-derived"
      ? "Illustrative — demo data, not your environment"
      : rateBasis === "default-assumption"
        ? "Directional — default loaded hourly assumption"
        : "Buyer-provided loaded hourly cost";

  return {
    display: formatUsd(usdEstimate),
    rateBasis,
    rateBasisLabel,
  };
}

export function interpretRoiSummaryMeaning(
  metrics: RoiSummaryPeriodMetrics,
  hourlyUsd: number,
  options?: { readonly isDefaultRate?: boolean; readonly demoDerived?: boolean },
): string {
  if (metrics.hours <= 1e-9) {
    return "ArchLucid needs finalized reviews before it can estimate review-time savings for this period. Complete a review or add governance signals to unlock a directional value estimate.";
  }

  const hoursLabel = formatHours(metrics.hours);
  const usdWithBasis = formatRoiSummaryUsdWithRateBasis(
    metrics.hours,
    metrics.usdEstimate,
    metrics.showUsdEstimate,
    {
      isDefaultRate: options?.isDefaultRate ?? true,
      demoDerived: options?.demoDerived,
    },
  );
  const valueLabel = metrics.showUsdEstimate ? usdWithBasis.display : "a directional dollar estimate";

  if (metrics.showUsdEstimate) {
    return `ArchLucid estimates approximately ${hoursLabel} of review and rework time avoided in this period — about ${valueLabel} (${usdWithBasis.rateBasisLabel.toLowerCase()} at ${formatUsd(hourlyUsd)}/hr). This is intended for pilot value discussions, not financial reporting.`;
  }

  return `ArchLucid estimates approximately ${hoursLabel} of review and rework time avoided in this period. Add more findings or raise the loaded hourly cost to surface a meaningful dollar estimate.`;
}

export function formatRoiSummaryRateLabel(
  options: { readonly isDefaultRate: boolean; readonly demoDerived?: boolean },
): string {
  return formatRoiSummaryUsdWithRateBasis(1, 1, true, options).rateBasisLabel;
}

export function buildRoiSummaryExportMarkdown(input: {
  readonly windowTitle: string;
  readonly metrics: RoiSummaryPeriodMetrics;
  readonly hourlyUsd: number;
  readonly isDefaultRate: boolean;
  readonly demoDerived?: boolean;
}): string {
  const usd = formatRoiSummaryUsdWithRateBasis(
    input.metrics.hours,
    input.metrics.usdEstimate,
    input.metrics.showUsdEstimate,
    { isDefaultRate: input.isDefaultRate, demoDerived: input.demoDerived },
  );

  const lines = [
    `# ROI summary — ${input.windowTitle}`,
    "",
    `Hours saved: ${formatRoiSummaryHoursDisplay(input.metrics.hours)}`,
    `Estimated value: ${usd.display}`,
    `Rate basis: ${usd.rateBasisLabel}`,
    `Loaded hourly cost: ${formatUsd(input.hourlyUsd)}`,
    "",
    interpretRoiSummaryMeaning(input.metrics, input.hourlyUsd, {
      isDefaultRate: input.isDefaultRate,
      demoDerived: input.demoDerived,
    }),
    "",
    roiSummaryDirectionalDisclaimer(),
  ];

  return lines.join("\n");
}

export function roiSummaryDirectionalDisclaimer(): string {
  return "This estimate is directional. It is intended for pilot value discussions, not financial reporting.";
}

export function roiSummaryZeroStateHeadline(): string {
  return "No ROI estimate yet";
}

export function roiSummaryZeroStateBody(): string {
  return "Finalized reviews or governance blocks are needed before ArchLucid can calculate savings.";
}

export function roiSummaryBasisOfEstimateCopy(): string {
  return "ArchLucid estimates savings from finalized review findings and governance blocks in the selected period.";
}

export function defaultLoadedHourlyUsdForDisplay(): number {
  return DEFAULT_LOADED_HOURLY_USD;
}
