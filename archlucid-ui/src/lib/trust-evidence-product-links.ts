import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import type { RunTrustEvidenceRouteRef } from "@/types/authority";

export type TrustEvidenceProductLink = {
  readonly href: string;
  readonly label: string;
};

function encodeRunPath(runId: string): string {
  return encodeURIComponent(runId.trim());
}

export function resolveTrustEvidenceProductLink(
  link: RunTrustEvidenceRouteRef,
  runId: string,
  topFindingId?: string | null,
): TrustEvidenceProductLink | null {
  const encodedRun = encodeRunPath(runId);

  switch (link.rel) {
    case "evidence":
      return {
        href: `/insights/evidence-graph?runId=${encodedRun}`,
        label: "Open evidence trail",
      };
    case "topFindingEvidenceChain": {
      const findingId = topFindingId?.trim() ?? "";

      if (findingId.length === 0) {
        return null;
      }

      return {
        href: getFindingEvidenceTraceHref(runId, findingId),
        label: "Open finding evidence trail",
      };
    }
    case "traces":
      return {
        href: `/governance/audit?runId=${encodedRun}`,
        label: "Open audit trail",
      };
    case "traceabilityZip":
      return {
        href: `/architecture/reviews/${encodedRun}/provenance`,
        label: "Open provenance view",
      };
    default:
      return null;
  }
}

export function resolveTrustEvidenceDiagnosticsApiPath(path: string): string {
  if (path.startsWith("/v1/")) {
    return `/api/proxy${path}`;
  }

  return path;
}
