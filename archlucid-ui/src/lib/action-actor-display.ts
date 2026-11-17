import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

/** Shown when an action attribution field has no recorded user name. */
export const ACTION_ACTOR_UNAVAILABLE = "Actor was not stored.";

export const GOVERNANCE_DECISION_OWNER_NAME_NOT_STORED = "Decision owner name was not stored." as const;

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

/** Governance review workspace — missing approver/owner ids are omission copy, not N/A placeholders. */
export function formatGovernanceDecisionOwnerName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();

  if (trimmed.length === 0) {
    return "Decision owner was not stored.";
  }

  return trimmed;
}

export type GovernanceDecisionOwnerCell = {
  readonly nameLabel: string;
  readonly userId: string | null;
};

/** Separates stored display names from raw user ids on governance decision owner cells. */
export function resolveGovernanceDecisionOwnerCell(
  operatorGovernanceDecisionByUserId: string | null | undefined,
): GovernanceDecisionOwnerCell {
  const trimmed = (operatorGovernanceDecisionByUserId ?? "").trim();

  if (trimmed.length === 0) {
    return { nameLabel: "Decision owner was not stored.", userId: null };
  }

  if (isUuidLike(trimmed)) {
    return { nameLabel: GOVERNANCE_DECISION_OWNER_NAME_NOT_STORED, userId: trimmed };
  }

  return { nameLabel: trimmed, userId: null };
}

export function formatGovernanceApproverName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();

  if (trimmed.length === 0) {
    return "Approver was not stored.";
  }

  return trimmed;
}
