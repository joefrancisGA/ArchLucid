export const FINDING_EVIDENCE_OPEN_PARAM = "findingEvidenceOpen";
export const FINDING_AUDIT_OPEN_PARAM = "findingAuditOpen";
export const FINDING_RELATED_AUDIT_OPEN_PARAM = "findingRelatedAuditOpen";
export const FINDING_TECHNICAL_METADATA_OPEN_PARAM = "findingTechnicalMetadataOpen";
export const FINDING_EVIDENCE_BASIS_OPEN_PARAM = "findingEvidenceBasisOpen";
export const FINDING_FULL_EVIDENCE_TRACE_OPEN_PARAM = "findingFullEvidenceTraceOpen";
export const FINDING_WORK_WITH_OPEN_PARAM = "findingWorkWithOpen";

export type FindingDetailInspectDisclosureUrlState = {
  readonly evidenceOpen: boolean;
  readonly auditOpen: boolean;
  readonly relatedAuditOpen: boolean;
  readonly technicalMetadataOpen: boolean;
  readonly evidenceBasisOpen: boolean;
  readonly fullEvidenceTraceOpen: boolean;
  readonly workWithOpen: boolean;
};

function parseBooleanOpenParam(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingEvidenceOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingAuditOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingRelatedAuditOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingTechnicalMetadataOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingEvidenceBasisOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingFullEvidenceTraceOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseFindingWorkWithOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function findingDetailInspectDisclosureHrefFromSearch(
  currentSearch: string,
  state: FindingDetailInspectDisclosureUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.evidenceOpen) {
    params.delete(FINDING_EVIDENCE_OPEN_PARAM);
  } else {
    params.set(FINDING_EVIDENCE_OPEN_PARAM, "1");
  }

  if (!state.auditOpen) {
    params.delete(FINDING_AUDIT_OPEN_PARAM);
  } else {
    params.set(FINDING_AUDIT_OPEN_PARAM, "1");
  }

  if (!state.relatedAuditOpen) {
    params.delete(FINDING_RELATED_AUDIT_OPEN_PARAM);
  } else {
    params.set(FINDING_RELATED_AUDIT_OPEN_PARAM, "1");
  }

  if (!state.technicalMetadataOpen) {
    params.delete(FINDING_TECHNICAL_METADATA_OPEN_PARAM);
  } else {
    params.set(FINDING_TECHNICAL_METADATA_OPEN_PARAM, "1");
  }

  if (!state.evidenceBasisOpen) {
    params.delete(FINDING_EVIDENCE_BASIS_OPEN_PARAM);
  } else {
    params.set(FINDING_EVIDENCE_BASIS_OPEN_PARAM, "1");
  }

  if (!state.fullEvidenceTraceOpen) {
    params.delete(FINDING_FULL_EVIDENCE_TRACE_OPEN_PARAM);
  } else {
    params.set(FINDING_FULL_EVIDENCE_TRACE_OPEN_PARAM, "1");
  }

  if (!state.workWithOpen) {
    params.delete(FINDING_WORK_WITH_OPEN_PARAM);
  } else {
    params.set(FINDING_WORK_WITH_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
