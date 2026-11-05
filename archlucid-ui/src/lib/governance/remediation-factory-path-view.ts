import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

export const REMEDIATION_FACTORY_PATH_VIEW_VALUES = [
  "all",
  "public-exposure",
  "privilege",
  "insufficient-evidence",
] as const;

export type RemediationFactoryPathView = (typeof REMEDIATION_FACTORY_PATH_VIEW_VALUES)[number];

export function resolveRemediationFactoryPathViewForRankedPath(
  row: Pick<SecurityEvidencePathRankSummary, "pathKind" | "pathConfidenceBand">,
): RemediationFactoryPathView {
  if (row.pathConfidenceBand === "InsufficientEvidence") {
    return "insufficient-evidence";
  }

  const kind = row.pathKind.toLowerCase();

  if (kind.includes("reachability")) {
    return "public-exposure";
  }

  if (kind.includes("privilege")) {
    return "privilege";
  }

  return "all";
}

export function remediationFactoryPathViewLabel(view: RemediationFactoryPathView): string {
  switch (view) {
    case "public-exposure":
      return "Public exposure";
    case "privilege":
      return "Privilege paths";
    case "insufficient-evidence":
      return "Insufficient evidence";
    case "all":
      return "All paths";
    default: {
      const _exhaustive: never = view;

      return _exhaustive;
    }
  }
}
