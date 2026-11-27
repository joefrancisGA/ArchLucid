/** Additive response fields. Older responses and unrecognized states fail closed. */
export type AnalysisCoverage = {
  readonly state?: string;
  readonly freshness?: string;
  readonly evidenceAsOfUtc?: string;
  readonly recovery?: string;
  readonly advisoryOnlyDegradation?: boolean;
  readonly canAssertAbsence?: boolean;
};

export function readAnalysisCoverage(parent: unknown): AnalysisCoverage | null {
  if (typeof parent !== "object" || parent === null || !("analysisCoverage" in parent)) {
    return null;
  }

  const value = parent.analysisCoverage;
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value;
}

export function canAssertScopedAbsence(coverage: AnalysisCoverage | null | undefined): boolean {
  return coverage?.canAssertAbsence === true && coverage.state === "complete"
    && (coverage.freshness === "historical" || coverage.freshness === "current");
}

export function presentAnalysisCoverage(coverage: AnalysisCoverage | null | undefined) {
  if (coverage?.freshness === "stale" || coverage?.state === "stale") {
    return { kind: "needs-attention", label: "Stale evidence", detail: "This evidence cannot establish current coverage." } as const;
  }

  if (canAssertScopedAbsence(coverage)) {
    return coverage?.freshness === "historical"
      ? { kind: "ready", label: "Historical coverage complete", detail: "Applies only to the recorded evidence, not the current environment." } as const
      : { kind: "ready", label: "Coverage complete", detail: "Applies only to the evaluated scope." } as const;
  }

  if (coverage?.recovery === "retry_exhausted") {
    return { kind: "needs-attention", label: "Retry budget exhausted", detail: "Available results do not establish absence." } as const;
  }

  switch (coverage?.state) {
    case "pending":
      return { kind: "in-progress", label: "Analysis pending", detail: "New results may appear when analysis completes." } as const;
    case "failed":
      return { kind: "needs-attention", label: "Analysis failed", detail: "Available results do not establish absence." } as const;
    case "incomplete":
      return {
        kind: "needs-attention",
        label: coverage.advisoryOnlyDegradation ? "Advisory coverage incomplete" : "Coverage incomplete",
        detail: "Available results do not establish absence.",
      } as const;
    case "not_applicable":
      return { kind: "neutral", label: "Analysis not applicable", detail: "This analysis did not apply to the recorded scope." } as const;
    default:
      return { kind: "neutral", label: "Coverage unverified", detail: "Available results do not establish absence." } as const;
  }
}
