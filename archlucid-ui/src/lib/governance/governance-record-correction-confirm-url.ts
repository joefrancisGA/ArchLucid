import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const GOVERNANCE_RECORD_CORRECTION_KIND_PARAM = "govCorrectionKind";
export const GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM = "govCorrectionSubjectId";
export const GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM = "govCorrectionRunId";

export type GovernanceRecordCorrectionConfirmUrlState = {
  readonly mutationKind: string | null;
  readonly subjectId: string | null;
  readonly runId: string | null;
};

export function parseGovernanceRecordCorrectionKindFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseGovernanceRecordCorrectionSubjectIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseGovernanceRecordCorrectionRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceRecordCorrectionConfirmHrefFromSearch(
  currentSearch: string,
  state: GovernanceRecordCorrectionConfirmUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const mutationKind = (state.mutationKind ?? "").trim();
    const subjectId = (state.subjectId ?? "").trim();
    const runId = (state.runId ?? "").trim();

    if (mutationKind.length === 0 || subjectId.length === 0 || runId.length === 0) {
      params.delete(GOVERNANCE_RECORD_CORRECTION_KIND_PARAM);
      params.delete(GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM);
      params.delete(GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM);
    } else {
      params.set(GOVERNANCE_RECORD_CORRECTION_KIND_PARAM, mutationKind);
      params.set(GOVERNANCE_RECORD_CORRECTION_SUBJECT_ID_PARAM, subjectId);
      params.set(GOVERNANCE_RECORD_CORRECTION_RUN_ID_PARAM, runId);
    }
    },
  });
}
