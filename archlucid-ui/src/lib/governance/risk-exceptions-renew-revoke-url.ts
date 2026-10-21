import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const RISK_EXCEPTION_RENEW_PARAM = "renewId";
export const RISK_EXCEPTION_REVOKE_PARAM = "revokeId";

export type RiskExceptionsRenewRevokeUrlState = {
  readonly renewId: string | null;
  readonly revokeId: string | null;
};

export function parseRiskExceptionRenewIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRiskExceptionRevokeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function riskExceptionsRenewRevokeHrefFromSearch(
  currentSearch: string,
  state: RiskExceptionsRenewRevokeUrlState,
  pathname: string = GOVERNANCE_EXCEPTIONS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const renewId = (state.renewId ?? "").trim();
    const revokeId = (state.revokeId ?? "").trim();

    if (renewId.length === 0) {
      params.delete(RISK_EXCEPTION_RENEW_PARAM);
    } else {
      params.set(RISK_EXCEPTION_RENEW_PARAM, renewId);
    }

    if (revokeId.length === 0) {
      params.delete(RISK_EXCEPTION_REVOKE_PARAM);
    } else {
      params.set(RISK_EXCEPTION_REVOKE_PARAM, revokeId);
    }
    },
  });
}
