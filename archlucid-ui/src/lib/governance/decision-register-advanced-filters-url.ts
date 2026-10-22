import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const DECISION_REGISTER_CATEGORY_PARAM = "category";
export const DECISION_REGISTER_CONFIDENCE_BASIS_PARAM = "basis";

export const DECISION_REGISTER_CONFIDENCE_BASIS_OPTIONS = [
  "Evidence-backed",
  "Model-assisted",
  "Unknown",
] as const;

export type DecisionRegisterConfidenceBasisFilter =
  | (typeof DECISION_REGISTER_CONFIDENCE_BASIS_OPTIONS)[number]
  | "";

const CONFIDENCE_BASIS_IDS = new Set<string>(DECISION_REGISTER_CONFIDENCE_BASIS_OPTIONS);

export function parseDecisionRegisterCategoryFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw;
}

export function parseDecisionRegisterConfidenceBasisFromSearch(
  raw: string | null | undefined,
): DecisionRegisterConfidenceBasisFilter {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!CONFIDENCE_BASIS_IDS.has(trimmed)) {
    return "";
  }

  return trimmed as DecisionRegisterConfidenceBasisFilter;
}

export function decisionRegisterCategoryHrefFromSearch(
  currentSearch: string,
  category: string,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = category.trim();

    if (trimmed.length === 0) {
      params.delete(DECISION_REGISTER_CATEGORY_PARAM);
    } else {
      params.set(DECISION_REGISTER_CATEGORY_PARAM, trimmed);
    }
    },
  });
}

export function decisionRegisterConfidenceBasisHrefFromSearch(
  currentSearch: string,
  basis: DecisionRegisterConfidenceBasisFilter,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (basis.length === 0) {
      params.delete(DECISION_REGISTER_CONFIDENCE_BASIS_PARAM);
    } else {
      params.set(DECISION_REGISTER_CONFIDENCE_BASIS_PARAM, basis);
    }
    },
  });
}
