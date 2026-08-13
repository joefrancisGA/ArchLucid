import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { CostEvidenceFreshnessPresentation } from "@/lib/executive/executive-roi-kpi-display";

/** Maps cost-evidence freshness presentation to enterprise StatusTag kind. */
export function costEvidenceFreshnessStatusTagKind(
  state: CostEvidenceFreshnessPresentation["state"],
): EnterpriseStatusKind {
  switch (state) {
    case "fresh":
      return "ready";

    case "stale":
    case "missing":
    case "not-estimated":
      return "needs-attention";

    case "demo-derived":
      return "in-progress";

    case "loading":
      return "in-progress";

    default: {
      const exhaustive: never = state;

      return exhaustive;
    }
  }
}

/** Compact label for portfolio headline scope code on the proof strip. */
export function formatExecutiveHeadlineScopeCodeLabel(scopeCode: string | undefined): string | null {
  const code = scopeCode?.trim() ?? "";

  if (code.length === 0) {
    return null;
  }

  return `Headline scope: ${code}`;
}
