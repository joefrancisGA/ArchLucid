import type { RunDetail } from "@/types/authority";

import type { RunSavingsSummaryModel } from "./run-savings-summary-model";

type ServerEstimatedUsdSavingsWire = {
  estimatedUsdSavings?: number | null;
  savingsPricingBasis?: string | null;
  savingsPricingBasisDescription?: string | null;
};

/** Prefer server-authoritative savings on run detail before extractor artifact heuristics. */
export function resolveRunSavingsSummaryFromRunDetail(
  detail: RunDetail,
): RunSavingsSummaryModel | null {
  const wire = (detail as RunDetail & { estimatedUsdSavingsSummary?: ServerEstimatedUsdSavingsWire | null })
    .estimatedUsdSavingsSummary;

  if (wire === null || wire === undefined) {
    return null;
  }

  const amount = wire.estimatedUsdSavings;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const footnotes: string[] = [];

  if (typeof wire.savingsPricingBasisDescription === "string" && wire.savingsPricingBasisDescription.trim().length > 0) {
    footnotes.push(wire.savingsPricingBasisDescription.trim());
  }

  if (typeof wire.savingsPricingBasis === "string" && wire.savingsPricingBasis.trim().length > 0) {
    footnotes.push(`Pricing basis: ${wire.savingsPricingBasis.trim()}.`);
  }

  return {
    annualizedUsd: Math.round(amount),
    basisFootnotes: footnotes,
  };
}
