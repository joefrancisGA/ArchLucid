import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-report-markdown";
import { presentCostEvidenceFreshness } from "@/lib/sponsor/sponsor-roi-kpi-display";

export type BoardPackClusterEvidencePosture = "extractor-backed" | "illustrative" | "review-backed";

export type BoardPackEvidenceClusterRow = {
  readonly clusterLabel: string;
  readonly findingCount: number;
  readonly posture: BoardPackClusterEvidencePosture;
  readonly detail: string;
};

function resolveCostClusterPosture(summary: SponsorRoiSummary): {
  readonly posture: "extractor-backed" | "illustrative";
  readonly detail: string;
} {
  const costFreshness = presentCostEvidenceFreshness({
    loading: false,
    status: summary.costEvidenceFreshnessStatus,
    savingsPricingBasis: summary.savingsPricingBasis,
    staleAfterDays: summary.costEvidenceStaleAfterDays,
  });

  if (costFreshness.state === "fresh") {
    return {
      posture: "extractor-backed",
      detail: "Cost savings lines in the board pack can cite fresh Azure inventory evidence.",
    };
  }

  const footnote = costFreshness.footnote?.trim() ?? "";

  return {
    posture: "illustrative",
    detail:
      footnote.length > 0
        ? footnote
        : "Cost savings in the board pack are illustrative until Azure inventory evidence is uploaded and fresh.",
  };
}

function isCostCategory(category: string): boolean {
  return /cost|finops|spend|savings/i.test(category);
}

function countCostThemeFindings(summary: SponsorRoiSummary): number {
  const fromCounts = summary.businessImpactCategoryCounts?.costThemeCount;

  if (typeof fromCounts === "number" && Number.isFinite(fromCounts) && fromCounts > 0) {
    return Math.trunc(fromCounts);
  }

  return summary.topSystemicIssues
    .filter((issue) => isCostCategory(issue.category))
    .reduce((total, issue) => total + Math.max(0, issue.count), 0);
}

/** Derives illustrative vs extractor-backed posture per finding cluster for board-pack export. */
export function buildBoardPackEvidenceClusterRows(summary: SponsorRoiSummary): BoardPackEvidenceClusterRow[] {
  const rows: BoardPackEvidenceClusterRow[] = [];
  const costPosture = resolveCostClusterPosture(summary);
  const costCount = countCostThemeFindings(summary);

  if (costCount > 0) {
    rows.push({
      clusterLabel: "Cost optimization",
      findingCount: costCount,
      posture: costPosture.posture,
      detail: costPosture.detail,
    });
  }

  for (const issue of summary.topSystemicIssues) {
    if (isCostCategory(issue.category)) {
      continue;
    }

    rows.push({
      clusterLabel: issue.category,
      findingCount: Math.max(0, issue.count),
      posture: "review-backed",
      detail:
        "Findings come from committed reviews and governed evaluation — not generic model advice alone.",
    });
  }

  if (rows.length === 0) {
    rows.push({
      clusterLabel: "Portfolio savings headline",
      findingCount: Math.max(0, summary.latestRunCount),
      posture: costPosture.posture,
      detail: costPosture.detail,
    });
  }

  return rows;
}

export function boardPackClusterPostureLabel(posture: BoardPackClusterEvidencePosture): string {
  switch (posture) {
    case "extractor-backed":
      return "Extractor-backed";

    case "illustrative":
      return "Illustrative";

    case "review-backed":
      return "Review-backed";

    default: {
      const exhaustive: never = posture;

      return exhaustive;
    }
  }
}
