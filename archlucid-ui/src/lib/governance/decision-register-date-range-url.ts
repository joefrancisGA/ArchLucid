import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

import {
  DECISION_REGISTER_FROM_PARAM,
  DECISION_REGISTER_TO_PARAM,
} from "@/lib/governance/decision-register-custom-date-url";
import {
  DEFAULT_DECISION_REGISTER_DATE_PRESET,
  type DecisionRegisterDatePreset,
} from "@/app/(operator)/governance/decision-register/decision-register-date-range";

export const DECISION_REGISTER_DATE_RANGE_PARAM = "range";

const DATE_PRESET_IDS = new Set<string>(["30", "90", "all"]);

export function parseDecisionRegisterDatePresetFromSearch(
  raw: string | null | undefined,
): DecisionRegisterDatePreset {
  if (raw === null || raw === undefined) {
    return DEFAULT_DECISION_REGISTER_DATE_PRESET;
  }

  const trimmed = raw.trim();

  if (!DATE_PRESET_IDS.has(trimmed)) {
    return DEFAULT_DECISION_REGISTER_DATE_PRESET;
  }

  return trimmed as DecisionRegisterDatePreset;
}

export function decisionRegisterDatePresetHrefFromSearch(
  currentSearch: string,
  preset: DecisionRegisterDatePreset,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (preset === DEFAULT_DECISION_REGISTER_DATE_PRESET) {
    params.delete(DECISION_REGISTER_DATE_RANGE_PARAM);
  } else {
    params.set(DECISION_REGISTER_DATE_RANGE_PARAM, preset);
  }

  params.delete(DECISION_REGISTER_FROM_PARAM);
  params.delete(DECISION_REGISTER_TO_PARAM);

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
