import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_OPTIONAL_ARTIFACT_TECHNICAL_DETAILS_OPEN_PARAM =
  "findingOptionalArtifactTechnicalDetailsOpen";

export function parseFindingOptionalArtifactTechnicalDetailsOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingOptionalArtifactTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FINDING_OPTIONAL_ARTIFACT_TECHNICAL_DETAILS_OPEN_PARAM);
}
