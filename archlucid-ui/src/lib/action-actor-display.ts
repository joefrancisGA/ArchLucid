/** Shown when an action attribution field has no recorded user name. */
export const ACTION_ACTOR_UNAVAILABLE = "N/A";

type MeClaim = { readonly type: string; readonly value: string };

export type OperatorPrincipalOwnerLabelInput = {
  readonly name?: string | null;
  readonly meClaims?: readonly MeClaim[];
};

const EMAIL_SHORT_CLAIM_TYPE = "email";
const EMAIL_LONG_CLAIM_TYPE = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const PREFERRED_USERNAME_CLAIM_TYPE = "preferred_username";
const UPN_CLAIM_TYPE = "upn";
const NAME_CLAIM_TYPE = "name";

function claimValue(claims: readonly MeClaim[], claimType: string): string | null {
  const claim = claims.find((entry) => entry.type === claimType);
  const value = claim?.value?.trim() ?? "";

  return value.length > 0 ? value : null;
}

/**
 * Resolves the signed-in operator's username for owner columns — prefers display name, then
 * JWT identity claims (preferred_username, email, upn). Never returns a generic "You" placeholder.
 */
export function resolveOperatorPrincipalOwnerLabel(input: OperatorPrincipalOwnerLabelInput): string | null {
  const identityName = (input.name ?? "").trim();

  if (identityName.length > 0) {
    return identityName;
  }

  const claims = input.meClaims ?? [];
  const jwtName = claimValue(claims, NAME_CLAIM_TYPE);

  if (jwtName !== null) {
    return jwtName;
  }

  const preferredUsername = claimValue(claims, PREFERRED_USERNAME_CLAIM_TYPE);

  if (preferredUsername !== null) {
    return preferredUsername;
  }

  const email =
    claimValue(claims, EMAIL_SHORT_CLAIM_TYPE) ?? claimValue(claims, EMAIL_LONG_CLAIM_TYPE);

  if (email !== null) {
    return email;
  }

  const upn = claimValue(claims, UPN_CLAIM_TYPE);

  if (upn !== null) {
    return upn;
  }

  return null;
}

/**
 * Formats who performed an auditable action — always the recorded user name, never a role title.
 * Returns {@link ACTION_ACTOR_UNAVAILABLE} when the name is missing or blank.
 */
export function formatActionActorName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();

  if (trimmed.length === 0) {
    return ACTION_ACTOR_UNAVAILABLE;
  }

  return trimmed;
}
