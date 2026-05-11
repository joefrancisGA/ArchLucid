import type { RunDetail } from "@/types/authority";

/** Inputs derived only from GET run detail `results[].findings` (ArchitectureFinding). */
export type QuickDecisionFinding = {
  findingId: string;
  title: string;
  recommendation: string;
  /** Raw `FindingSeverity` enum numeric from API (higher = more severe). */
  severityValue: number;
  /** Stable order within the flattened results/findings traversal. */
  findingOrder: number;
};

export function firstRecommendationSentence(text: string): string {
  const t = text.trim();

  if (t.length === 0) {
    return "";
  }

  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(t);

  if (match !== null) {
    return match[0].trim();
  }

  return t;
}

export function severityBadgeLabel(severityValue: number): string {
  switch (severityValue) {
    case 3:
      return "Critical";
    case 2:
      return "High";
    case 1:
      return "Medium";
    case 0:
    default:
      return "Info";
  }
}

function normalizedSeverity(severityValue: number): number {
  if (!Number.isFinite(severityValue)) {
    return 0;
  }

  const n = Math.trunc(severityValue);

  if (n < 0) {
    return 0;
  }

  if (n > 3) {
    return 3;
  }

  return n;
}

/**
 * Flattens agent results findings from run detail (no extra HTTP calls).
 * Title prefers `message`, then `category`, then finding id.
 * Recommendation prefers `reasoningTrace`.
 */
export function extractQuickDecisionFindingsFromRunDetail(detail: RunDetail): QuickDecisionFinding[] {
  const raw = detail as Record<string, unknown>;
  const results = raw.results;

  if (!Array.isArray(results)) {
    return [];
  }

  let order = 0;
  const out: QuickDecisionFinding[] = [];

  for (const r of results) {
    if (r === null || typeof r !== "object") {
      continue;
    }

    const findings = (r as Record<string, unknown>).findings;

    if (!Array.isArray(findings)) {
      continue;
    }

    for (const f of findings) {
      if (f === null || typeof f !== "object") {
        continue;
      }

      const fr = f as Record<string, unknown>;
      const findingId = typeof fr.findingId === "string" ? fr.findingId.trim() : "";

      if (findingId.length === 0) {
        continue;
      }

      const message = typeof fr.message === "string" ? fr.message.trim() : "";
      const category = typeof fr.category === "string" ? fr.category.trim() : "";
      const title =
        message.length > 0 ? message : category.length > 0 ? category : findingId;
      const reasoning =
        typeof fr.reasoningTrace === "string" && fr.reasoningTrace.trim().length > 0
          ? fr.reasoningTrace.trim()
          : "";

      const severityRaw = fr.severity;
      const severityValue =
        typeof severityRaw === "number" && Number.isFinite(severityRaw)
          ? normalizedSeverity(severityRaw)
          : 0;

      out.push({
        findingId,
        title,
        recommendation: reasoning,
        severityValue,
        findingOrder: order++,
      });
    }
  }

  return out;
}

/** Highest severity first, then original finding order. */
export function sortQuickDecisionFindings(findings: readonly QuickDecisionFinding[]): QuickDecisionFinding[] {
  return [...findings].sort((a, b) => {
    if (b.severityValue !== a.severityValue) {
      return b.severityValue - a.severityValue;
    }

    return a.findingOrder - b.findingOrder;
  });
}
