import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { stableAssumptionIdFromText } from "./stable-assumption-id";

export type UnverifiedAssumption = {
  readonly id: string;
  readonly text: string;
  readonly existential: boolean;
};

const EXISTENTIAL_TOKENS = [
  "data class",
  "rto",
  "rpo",
  "trust boundary",
  "recovery",
  "pii",
  "phi",
  "regulated",
] as const;

/** TB-2314: unverified assumptions become confirm / replace / caveat work. */
export function parseUnverifiedAssumptions(assumptions: readonly string[]): readonly UnverifiedAssumption[] {
  const results: UnverifiedAssumption[] = [];

  for (const assumptionText of assumptions) {
    const text = assumptionText?.trim() ?? "";

    if (text.length === 0) {
      continue;
    }

    const lower = text.toLowerCase();
    const existential = EXISTENTIAL_TOKENS.some((token) => lower.includes(token));

    results.push({
      id: stableAssumptionIdFromText(text),
      text,
      existential,
    });
  }

  return results;
}

export function countExistentialUnverifiedAssumptions(assumptions: readonly UnverifiedAssumption[]): number {
  return assumptions.filter((assumption) => assumption.existential).length;
}

function readAssumptionLabelFromFinding(finding: QuickDecisionFinding): string | null {
  const combined = `${finding.title}\n${finding.recommendation}\n${finding.aiReasoning.reasoningTrace}`;

  if (!/assumption/i.test(combined)) {
    return null;
  }

  const trimmedTitle = finding.title.trim();

  if (trimmedTitle.length > 0) {
    return trimmedTitle;
  }

  const trimmedRecommendation = finding.recommendation.trim();

  if (trimmedRecommendation.length > 0) {
    return trimmedRecommendation;
  }

  const trimmedReasoning = finding.aiReasoning.reasoningTrace.trim();

  if (trimmedReasoning.length > 0) {
    return trimmedReasoning;
  }

  return null;
}

/** TB-2314 / TB-2321: assumption findings may carry the label only in recommendation when title is empty. */
export function deriveUnverifiedAssumptionTextsFromFindings(
  findings: readonly QuickDecisionFinding[],
  shouldIncludeFinding: (finding: QuickDecisionFinding) => boolean = () => true,
): string[] {
  const texts: string[] = [];

  for (const finding of findings) {
    if (!shouldIncludeFinding(finding)) {
      continue;
    }

    const label = readAssumptionLabelFromFinding(finding);

    if (label !== null) {
      texts.push(label);
    }
  }

  return texts;
}

/** Merge finding-derived and request assumptions without duplicate labels (TB-2314). */
export function mergeUnverifiedAssumptionTexts(
  findingTexts: readonly string[],
  requestAssumptionTexts: readonly string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const text of [...findingTexts, ...requestAssumptionTexts]) {
    const trimmed = text.trim();
    const dedupeKey = trimmed.toLowerCase();

    if (trimmed.length === 0 || seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    merged.push(trimmed);
  }

  return merged;
}

export type StatedConstraintContext = {
  readonly rtoMinutes: number | null;
  readonly rpoMinutes: number | null;
  readonly monthlyCostCeilingUsd: number | null;
};

/** TB-2319: severity labels reference stated constraints when the finding text mentions them. */
export function buildSeverityConstraintNote(
  findingText: string,
  constraints: StatedConstraintContext,
): string | null {
  const lower = findingText.toLowerCase();

  if (lower.includes("rto") && constraints.rtoMinutes !== null) {
    return `Stated RTO: ${constraints.rtoMinutes} minutes — calibrate severity against this target, not a generic outage SLA.`;
  }

  if (lower.includes("rpo") && constraints.rpoMinutes !== null) {
    return `Stated RPO: ${constraints.rpoMinutes} minutes — calibrate severity against this target.`;
  }

  if (
    (lower.includes("cost") || lower.includes("budget"))
    && constraints.monthlyCostCeilingUsd !== null
  ) {
    return `Stated monthly cost ceiling: $${constraints.monthlyCostCeilingUsd} — calibrate cost findings against this ceiling.`;
  }

  return null;
}
