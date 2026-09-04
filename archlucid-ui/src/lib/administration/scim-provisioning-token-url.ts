import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";

export const SCIM_TOKEN_CREATE_PARAM = "scimCreate";
export const SCIM_TOKEN_REVOKE_PARAM = "scimRevokeId";

export type ScimProvisioningTokenUrlState = {
  readonly createOpen: boolean;
  readonly revokeTokenId: string | null;
};

export function parseScimTokenCreateOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseScimTokenRevokeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function scimProvisioningTokenHrefFromSearch(
  currentSearch: string,
  state: ScimProvisioningTokenUrlState,
  pathname: string = SCIM_PROVISIONING_CANONICAL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const revokeTokenId = (state.revokeTokenId ?? "").trim();

  if (!state.createOpen) {
    params.delete(SCIM_TOKEN_CREATE_PARAM);
  } else {
    params.set(SCIM_TOKEN_CREATE_PARAM, "1");
  }

  if (revokeTokenId.length === 0) {
    params.delete(SCIM_TOKEN_REVOKE_PARAM);
  } else {
    params.set(SCIM_TOKEN_REVOKE_PARAM, revokeTokenId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
