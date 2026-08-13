import contractJson from "../../../../docs/library/RUN_DETAIL_KPI_SEMANTIC_CONTRACT.json";

/** TB-320: server-authoritative run-detail KPI / proof field contract (display/formatting only in UI). */
export type RunDetailKpiSemanticField = {
  readonly id: string;
  readonly dtoField: string;
  readonly forbiddenUiPatterns?: readonly string[];
  readonly uiSource?: string;
};

export type RunDetailKpiSemanticContract = {
  readonly schemaVersion: number;
  readonly fields: readonly RunDetailKpiSemanticField[];
};

export const RUN_DETAIL_KPI_SEMANTIC_CONTRACT = contractJson as RunDetailKpiSemanticContract;

/** Patterns that must not appear in run-detail KPI wiring. */
export const RUN_DETAIL_KPI_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /failedEngineLabels\?\.length\s*>\s*0\s*&&/,
  /dispositionCoverage\?\.accepted\s*\+/,
  /dispositionCoverage\?\.rejected\s*\+/,
  /governanceWarnings\.length\s*>\s*0/,
  /tokenCount\s*\*/,
  /computeLlmCost/,
  /buildTrustEvidenceCard/,
];

export function listRunDetailForbiddenPatternOffenders(source: string): string[] {
  return RUN_DETAIL_KPI_FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(source)).map(
    (pattern) => pattern.source,
  );
}

/** Pure display helper — never recomputes business semantics from raw findings. */
export function presentRunDetailKpiFlag(
  serverValue: boolean | null | undefined,
  options?: { readonly loading?: boolean },
): { readonly display: string; readonly value: boolean | null } {
  if (options?.loading === true) {
    return { display: "—", value: null };
  }

  if (serverValue === true) {
    return { display: "Yes", value: true };
  }

  if (serverValue === false) {
    return { display: "No", value: false };
  }

  return { display: "—", value: null };
}
