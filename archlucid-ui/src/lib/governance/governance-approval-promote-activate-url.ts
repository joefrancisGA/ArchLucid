import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const GOVERNANCE_PROMOTE_MANIFEST_PARAM = "promoteManifest";
export const GOVERNANCE_PROMOTE_ENV_PARAM = "promoteEnv";
export const GOVERNANCE_ACTIVATE_ID_PARAM = "activateId";

export type GovernanceApprovalPromoteActivateUrlState = {
  readonly promoteManifestId: string | null;
  readonly promoteTargetEnv: string | null;
  readonly activateId: string | null;
};

export function parseGovernancePromoteManifestFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseGovernancePromoteEnvFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseGovernanceActivateIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceApprovalPromoteActivateHrefFromSearch(
  currentSearch: string,
  state: GovernanceApprovalPromoteActivateUrlState,
  pathname: string = GOVERNANCE_APPROVAL_QUEUE_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const promoteManifestId = (state.promoteManifestId ?? "").trim();
    const promoteTargetEnv = (state.promoteTargetEnv ?? "").trim();
    const activateId = (state.activateId ?? "").trim();

    if (promoteManifestId.length === 0 || promoteTargetEnv.length === 0) {
      params.delete(GOVERNANCE_PROMOTE_MANIFEST_PARAM);
      params.delete(GOVERNANCE_PROMOTE_ENV_PARAM);
    } else {
      params.set(GOVERNANCE_PROMOTE_MANIFEST_PARAM, promoteManifestId);
      params.set(GOVERNANCE_PROMOTE_ENV_PARAM, promoteTargetEnv);
    }

    if (activateId.length === 0) {
      params.delete(GOVERNANCE_ACTIVATE_ID_PARAM);
    } else {
      params.set(GOVERNANCE_ACTIVATE_ID_PARAM, activateId);
    }
    },
  });
}
