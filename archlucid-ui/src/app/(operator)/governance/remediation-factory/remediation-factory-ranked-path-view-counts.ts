import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

export type RemediationFactoryRankedPathViewCounts = {
  readonly all: number;
  readonly publicExposure: number;
  readonly privilege: number;
  readonly insufficientEvidence: number;
};

export function computeRemediationFactoryRankedPathViewCounts(
  rows: ReadonlyArray<SecurityEvidencePathRankSummary>,
): RemediationFactoryRankedPathViewCounts {
  return {
    all: rows.length,
    publicExposure: rows.filter((row) => row.pathKind.toLowerCase().includes("reachability")).length,
    privilege: rows.filter((row) => row.pathKind.toLowerCase().includes("privilege")).length,
    insufficientEvidence: rows.filter((row) => row.pathConfidenceBand === "InsufficientEvidence").length,
  };
}

export type RemediationFactoryRankedPathViewValue =
  | "all"
  | "public-exposure"
  | "privilege"
  | "insufficient-evidence";

export function remediationFactoryRankedPathViewFilteredCount(
  view: RemediationFactoryRankedPathViewValue,
  counts: RemediationFactoryRankedPathViewCounts,
): number {
  switch (view) {
    case "all":
      return counts.all;
    case "public-exposure":
      return counts.publicExposure;
    case "privilege":
      return counts.privilege;
    case "insufficient-evidence":
      return counts.insufficientEvidence;
    default: {
      const _exhaustive: never = view;

      return counts.all;
    }
  }
}
