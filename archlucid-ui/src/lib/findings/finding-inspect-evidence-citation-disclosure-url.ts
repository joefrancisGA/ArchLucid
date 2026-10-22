import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM = "findingInspectEvidenceCitationArtifactId";

export function parseFindingInspectEvidenceCitationArtifactIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function findingInspectEvidenceCitationDisclosureHrefFromSearch(
  currentSearch: string,
  artifactId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (artifactId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM);
    } else {
      params.set(FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM, trimmed);
    }
    },
  });
}
