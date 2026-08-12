import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import {
  reviewSignedRecordPath,
  signedRecordDetailPath,
  signedRecordSectionPath,
} from "@/lib/signed-records-paths";

export type RecommendationSourceEvidenceLink = {
  readonly kind: "finding" | "manifestSection";
  readonly id: string;
};

export type RecommendationEvidenceLinkView = {
  readonly href: string;
  readonly label: string;
};

/** Maps API evidence anchors to operator-shell navigation targets. */
export function buildRecommendationEvidenceLinkViews(
  runId: string,
  manifestId: string | null | undefined,
  links: readonly RecommendationSourceEvidenceLink[],
): RecommendationEvidenceLinkView[] {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || links.length === 0)
    return [];

  return links.map((link) => {
    const trimmedId = link.id.trim();

    if (link.kind === "finding") {
      return {
        href: getFindingEvidenceTraceHref(trimmedRunId, trimmedId),
        label: `Finding ${trimmedId}`,
      };
    }

    const trimmedManifestId = manifestId?.trim() ?? "";

    if (trimmedManifestId.length > 0) {
      return {
        href: signedRecordSectionPath(trimmedManifestId, "manifest-decisions"),
        label: `Manifest section ${trimmedId}`,
      };
    }

    return {
      href: reviewSignedRecordPath(trimmedRunId),
      label: `Manifest section ${trimmedId}`,
    };
  });
}

/** Detail path helper for manifest-backed citations (signed-records canonical segment). */
export function recommendationManifestRecordHref(manifestId: string): string {
  return signedRecordDetailPath(manifestId);
}
