import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";

export const ACCOUNT_SECURITY_REMOVE_METHOD_PARAM = "removeMethod";
export const ACCOUNT_SECURITY_LINK_PROPOSAL_PARAM = "linkProposal";

export type AccountSecurityRemoveLinkUrlState = {
  readonly removeMethodIdentityId: string | null;
  readonly linkProposalId: string | null;
};

export function parseAccountSecurityRemoveMethodFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAccountSecurityLinkProposalFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function accountSecurityRemoveLinkHrefFromSearch(
  currentSearch: string,
  state: AccountSecurityRemoveLinkUrlState,
  pathname: string = ACCOUNT_SECURITY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const removeMethodIdentityId = (state.removeMethodIdentityId ?? "").trim();
  const linkProposalId = (state.linkProposalId ?? "").trim();

  if (removeMethodIdentityId.length === 0) {
    params.delete(ACCOUNT_SECURITY_REMOVE_METHOD_PARAM);
  } else {
    params.set(ACCOUNT_SECURITY_REMOVE_METHOD_PARAM, removeMethodIdentityId);
  }

  if (linkProposalId.length === 0) {
    params.delete(ACCOUNT_SECURITY_LINK_PROPOSAL_PARAM);
  } else {
    params.set(ACCOUNT_SECURITY_LINK_PROPOSAL_PARAM, linkProposalId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
