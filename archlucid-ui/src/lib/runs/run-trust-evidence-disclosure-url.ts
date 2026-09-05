export const TRUST_EVIDENCE_FIELDS_OPEN_PARAM = "trustEvidenceFieldsOpen";
export const TRUST_EVIDENCE_TECH_OPEN_PARAM = "trustEvidenceTechOpen";

export type RunTrustEvidenceDisclosureUrlState = {
  readonly fieldsOpen: boolean;
  readonly technicalOpen: boolean;
};

export function parseTrustEvidenceFieldsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseTrustEvidenceTechOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runTrustEvidenceDisclosureHrefFromSearch(
  currentSearch: string,
  state: RunTrustEvidenceDisclosureUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.fieldsOpen) {
    params.delete(TRUST_EVIDENCE_FIELDS_OPEN_PARAM);
  } else {
    params.set(TRUST_EVIDENCE_FIELDS_OPEN_PARAM, "1");
  }

  if (!state.technicalOpen) {
    params.delete(TRUST_EVIDENCE_TECH_OPEN_PARAM);
  } else {
    params.set(TRUST_EVIDENCE_TECH_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
