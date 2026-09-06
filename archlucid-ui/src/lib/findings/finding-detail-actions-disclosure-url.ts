export const FINDING_EXPORT_OPEN_PARAM = "findingExportOpen";
export const FINDING_TECHNICAL_IDS_OPEN_PARAM = "findingTechnicalIdsOpen";
export const FINDING_TECHNICAL_AUDIT_OPEN_PARAM = "findingTechnicalAuditOpen";

export type FindingDetailActionsDisclosureUrlState = {
  readonly exportOpen: boolean;
  readonly technicalIdsOpen: boolean;
  readonly technicalAuditOpen: boolean;
};

export function parseFindingExportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingTechnicalIdsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingTechnicalAuditOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function findingDetailActionsDisclosureHrefFromSearch(
  currentSearch: string,
  state: FindingDetailActionsDisclosureUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.exportOpen) {
    params.delete(FINDING_EXPORT_OPEN_PARAM);
  } else {
    params.set(FINDING_EXPORT_OPEN_PARAM, "1");
  }

  if (!state.technicalIdsOpen) {
    params.delete(FINDING_TECHNICAL_IDS_OPEN_PARAM);
  } else {
    params.set(FINDING_TECHNICAL_IDS_OPEN_PARAM, "1");
  }

  if (!state.technicalAuditOpen) {
    params.delete(FINDING_TECHNICAL_AUDIT_OPEN_PARAM);
  } else {
    params.set(FINDING_TECHNICAL_AUDIT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
