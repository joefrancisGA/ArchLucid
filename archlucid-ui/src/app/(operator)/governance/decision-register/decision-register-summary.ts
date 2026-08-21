import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

export type DecisionRegisterSummary = {
  readonly recordedDecisions: number;
  readonly recentDecisions: number;
  readonly highConfidenceDecisions: number;
  readonly decisionsNeedingReview: number;
  readonly lastRecordedDecisionLabel: string;
};

const HIGH_CONFIDENCE_THRESHOLD = 0.75;
const RECENT_DECISION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function parseRecordedAtMs(value: string | null | undefined): number | null {
  const raw = value?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const ms = Date.parse(raw);

  if (Number.isNaN(ms)) {
    return null;
  }

  return ms;
}

function formatRecordedAtLabel(value: string | null | undefined): string {
  const ms = parseRecordedAtMs(value);

  if (ms === null) {
    return " — ";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(ms));
}

export function isHighConfidenceDecision(decision: ArchitectureDecisionRegisterEntry): boolean {
  if (decisionNeedsReview(decision)) {
    return false;
  }

  if (typeof decision.confidence === "number" && decision.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return true;
  }

  return decision.buyerConfidenceSource === "Evidence-backed";
}

export function decisionNeedsReview(decision: ArchitectureDecisionRegisterEntry): boolean {
  if (decision.buyerConfidenceSource === "Unknown") {
    return true;
  }

  if (typeof decision.confidence === "number" && decision.confidence < 0.5) {
    return true;
  }

  return false;
}

export function deriveDecisionRegisterSummary(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): DecisionRegisterSummary {
  const now = Date.now();
  let recentDecisions = 0;
  let highConfidenceDecisions = 0;
  let decisionsNeedingReview = 0;
  let lastRecordedMs: number | null = null;
  let lastRecordedRaw: string | null = null;

  for (const decision of decisions) {
    const recordedMs = parseRecordedAtMs(decision.recordedAtUtc);

    if (recordedMs !== null && now - recordedMs <= RECENT_DECISION_WINDOW_MS) {
      recentDecisions += 1;
    }

    if (isHighConfidenceDecision(decision)) {
      highConfidenceDecisions += 1;
    }

    if (decisionNeedsReview(decision)) {
      decisionsNeedingReview += 1;
    }

    if (recordedMs !== null && (lastRecordedMs === null || recordedMs > lastRecordedMs)) {
      lastRecordedMs = recordedMs;
      lastRecordedRaw = decision.recordedAtUtc;
    }
  }

  return {
    recordedDecisions: decisions.length,
    recentDecisions,
    highConfidenceDecisions,
    decisionsNeedingReview,
    lastRecordedDecisionLabel: formatRecordedAtLabel(lastRecordedRaw),
  };
}
