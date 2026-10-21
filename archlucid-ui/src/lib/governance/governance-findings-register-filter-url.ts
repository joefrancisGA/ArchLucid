import {
  riskRegisterFilterFromQuery,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_FINDINGS_RESOURCE_GROUP_KEY_PARAM } from "@/lib/governance/governance-findings-resource-group-disclosure-url";
import { applyOperatorUrlSelectionSwitch } from "@/lib/operator/operator-url-selection-switch";

export const GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM = "filter";

export function parseGovernanceFindingsRegisterFilterFromSearch(
  raw: string | null | undefined,
): RiskRegisterFilter {
  if (raw === null || raw === undefined) {
    return "all";
  }

  return riskRegisterFilterFromQuery(raw);
}

export function governanceFindingsRegisterFilterHrefFromSearch(
  currentSearch: string,
  filter: RiskRegisterFilter,
  pathname: string = GOVERNANCE_FINDINGS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  applyOperatorUrlSelectionSwitch(params, { kind: "governance-findings-register-filter" });

  if (filter === "all") {
    params.delete(GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM);
  } else {
    params.set(GOVERNANCE_FINDINGS_REGISTER_FILTER_PARAM, filter);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
