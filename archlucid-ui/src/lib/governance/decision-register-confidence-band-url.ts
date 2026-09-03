import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

export const DECISION_REGISTER_MIN_CONFIDENCE_PARAM = "minConfidence";
export const DECISION_REGISTER_MAX_CONFIDENCE_PARAM = "maxConfidence";

export function parseDecisionRegisterMinConfidenceFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseDecisionRegisterMaxConfidenceFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function decisionRegisterMinConfidenceHrefFromSearch(
  currentSearch: string,
  minConfidence: string,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = minConfidence.trim();

  if (trimmed.length === 0) {
    params.delete(DECISION_REGISTER_MIN_CONFIDENCE_PARAM);
  } else {
    params.set(DECISION_REGISTER_MIN_CONFIDENCE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function decisionRegisterMaxConfidenceHrefFromSearch(
  currentSearch: string,
  maxConfidence: string,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = maxConfidence.trim();

  if (trimmed.length === 0) {
    params.delete(DECISION_REGISTER_MAX_CONFIDENCE_PARAM);
  } else {
    params.set(DECISION_REGISTER_MAX_CONFIDENCE_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
