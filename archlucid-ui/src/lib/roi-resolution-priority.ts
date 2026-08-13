import type { RunDetail } from "@/types/authority";

import { normalizeFindingSeverity } from "@/lib/design-tokens";
import {
  DEFAULT_LOADED_HOURLY_USD,
  formatHours,
  formatUsd,
  hoursSurfaced,
  readStoredHourlyUsd,
  type RoiHoursSurfacedInput,
} from "@/lib/roi-assumptions";
import type { RunSavingsSummaryModel } from "@/lib/runs/run-savings-summary-model";

export type RoiResolutionInputs = Readonly<{
  serverSummary?: RunSavingsSummaryModel | null;
  extractorSummary?: RunSavingsSummaryModel | null;
  clientHoursSummary?: RunSavingsSummaryModel | null;
  staticDemoSummary?: RunSavingsSummaryModel | null;
}>;

/** Applies the canonical four-tier savings resolution order across ROI surfaces. */
export function resolveRunSavingsUsd(inputs: RoiResolutionInputs): RunSavingsSummaryModel | null {
  const tiers: readonly (RunSavingsSummaryModel | null | undefined)[] = [
    inputs.serverSummary,
    inputs.extractorSummary,
    inputs.clientHoursSummary,
    inputs.staticDemoSummary,
  ];

  for (const tier of tiers) {
    if (tier === null || tier === undefined) {
      continue;
    }

    if (!Number.isFinite(tier.annualizedUsd) || tier.annualizedUsd <= 0) {
      continue;
    }

    return tier;
  }

  return null;
}

/** Tier 1 helper for executive-summary and scorecard server payloads. */
export function buildExecutiveServerSavingsSummary(
  totalEstimatedUsdSavings: number | null | undefined,
  savingsPricingBasisDescription?: string | null,
): RunSavingsSummaryModel | null {
  if (typeof totalEstimatedUsdSavings !== "number" || !Number.isFinite(totalEstimatedUsdSavings) || totalEstimatedUsdSavings <= 0) {
    return null;
  }

  const footnotes: string[] = [];

  if (typeof savingsPricingBasisDescription === "string" && savingsPricingBasisDescription.trim().length > 0) {
    footnotes.push(savingsPricingBasisDescription.trim());
  }

  if (footnotes.length === 0) {
    footnotes.push("Server-authoritative portfolio rollup.");
  }

  return {
    annualizedUsd: Math.round(totalEstimatedUsdSavings),
    basisFootnotes: footnotes,
    sourceKind: "server-findings",
  };
}

/** Tier 3 helper — labor-hours coefficients × loaded hourly rate. */
export function buildClientHoursSavingsSummary(
  counts: RoiHoursSurfacedInput,
  hourlyUsd: number = DEFAULT_LOADED_HOURLY_USD,
): RunSavingsSummaryModel | null {
  const safeHourly = Number.isFinite(hourlyUsd) && hourlyUsd > 0 ? hourlyUsd : DEFAULT_LOADED_HOURLY_USD;
  const hours = hoursSurfaced(counts);

  if (hours <= 0) {
    return null;
  }

  const annualizedUsd = Math.round(hours * safeHourly);

  if (annualizedUsd <= 0) {
    return null;
  }

  return {
    annualizedUsd,
    basisFootnotes: [
      `Labor-hours estimate: ${formatHours(hours)} surfaced at ${formatUsd(safeHourly)}/hr (client coefficients).`,
    ],
    sourceKind: "client-hours-estimate",
  };
}

function coerceArchitectureFindingSeverityValue(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.min(3, Math.trunc(raw)));
  }

  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isNaN(parsed)) {
      return Math.max(0, Math.min(3, parsed));
    }
  }

  return -1;
}

function incrementSeverityBucket(counts: RoiHoursSurfacedInput, severityValue: number): void {
  if (severityValue === 3) {
    counts.critical += 1;

    return;
  }

  if (severityValue === 2) {
    counts.high += 1;

    return;
  }

  if (severityValue === 1) {
    counts.medium += 1;
  }
}

/** Derives ROI severity inputs from run detail agent findings (tier 3 fallback input). */
export function countRunDetailFindingSeveritiesForRoi(detail: RunDetail): RoiHoursSurfacedInput {
  const counts: RoiHoursSurfacedInput = {
    critical: 0,
    high: 0,
    medium: 0,
    precommitBlocks: 0,
  };

  const raw = detail as Record<string, unknown>;
  const results = raw.results;

  if (!Array.isArray(results)) {
    return counts;
  }

  for (const result of results) {
    if (result === null || typeof result !== "object") {
      continue;
    }

    const findings = (result as Record<string, unknown>).findings;

    if (!Array.isArray(findings)) {
      continue;
    }

    for (const finding of findings) {
      if (finding === null || typeof finding !== "object") {
        continue;
      }

      const findingRecord = finding as Record<string, unknown>;
      const numericSeverity = coerceArchitectureFindingSeverityValue(findingRecord.severity);

      if (numericSeverity >= 0) {
        incrementSeverityBucket(counts, numericSeverity);

        continue;
      }

      const normalized = normalizeFindingSeverity(
        typeof findingRecord.severity === "string"
          ? findingRecord.severity
          : typeof findingRecord.severityLabel === "string"
            ? findingRecord.severityLabel
            : null,
      );

      if (normalized === "critical" || normalized === "error") {
        counts.critical += 1;
      } else if (normalized === "high" || normalized === "warning") {
        counts.high += 1;
      } else if (normalized === "medium") {
        counts.medium += 1;
      }
    }
  }

  return counts;
}

/** Builds tier 3 savings from run detail findings using the browser hourly override when available. */
export function buildRunDetailClientHoursSavingsSummary(detail: RunDetail): RunSavingsSummaryModel | null {
  const counts = countRunDetailFindingSeveritiesForRoi(detail);
  const hourlyUsd = readStoredHourlyUsd();

  return buildClientHoursSavingsSummary(counts, hourlyUsd);
}
