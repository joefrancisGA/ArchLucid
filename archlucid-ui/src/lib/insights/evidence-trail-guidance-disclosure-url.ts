import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const EVIDENCE_TRAIL_GUIDANCE_OPEN_PARAM = "evidenceTrailGuidanceOpen";

export function parseEvidenceTrailGuidanceOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function evidenceTrailGuidanceDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, EVIDENCE_TRAIL_GUIDANCE_OPEN_PARAM);
}
