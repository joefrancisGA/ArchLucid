import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM = "technologyBaselineEvidenceRefEntryId";

export function parseTechnologyBaselineEvidenceRefEntryIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function technologyBaselineEvidenceRefDisclosureHrefFromSearch(
  currentSearch: string,
  entryId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (entryId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM);
    } else {
      params.set(TECHNOLOGY_BASELINE_EVIDENCE_REF_ENTRY_ID_PARAM, trimmed);
    }
    },
  });
}
