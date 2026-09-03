import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

export const DECISION_REGISTER_FROM_PARAM = "from";
export const DECISION_REGISTER_TO_PARAM = "to";

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDecisionRegisterCustomDateFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!DATE_INPUT_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export function decisionRegisterCustomDateHrefFromSearch(
  currentSearch: string,
  recordedAfter: string,
  recordedBefore: string,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const from = parseDecisionRegisterCustomDateFromSearch(recordedAfter);
  const to = parseDecisionRegisterCustomDateFromSearch(recordedBefore);

  if (from.length === 0) {
    params.delete(DECISION_REGISTER_FROM_PARAM);
  } else {
    params.set(DECISION_REGISTER_FROM_PARAM, from);
  }

  if (to.length === 0) {
    params.delete(DECISION_REGISTER_TO_PARAM);
  } else {
    params.set(DECISION_REGISTER_TO_PARAM, to);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
