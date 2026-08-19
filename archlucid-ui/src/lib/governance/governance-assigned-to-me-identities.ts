import type { CurrentPrincipal } from "@/lib/current-principal";

const API_USER_ACTOR = "api-user";
const JWT_ACTOR_KEY_PREFIX = "jwt:";
const OID_SHORT_CLAIM_TYPE = "oid";
const OID_LONG_CLAIM_TYPE = "http://schemas.microsoft.com/identity/claims/objectidentifier";
const EMAIL_SHORT_CLAIM_TYPE = "email";
const EMAIL_LONG_CLAIM_TYPE = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const PREFERRED_USERNAME_CLAIM_TYPE = "preferred_username";
const UPN_CLAIM_TYPE = "upn";
const TID_CLAIM_TYPE = "tid";
const NAME_CLAIM_TYPE = "name";

type MeClaim = { readonly type: string; readonly value: string };

export type GovernanceAssignedToMeIdentityPrincipal = Pick<CurrentPrincipal, "name" | "meClaims">;

/** Mirrors server `ArchitectureRiskRegisterAssignedToMeIdentityResolver` with client `/me` fields. */
export function resolveGovernanceAssignedToMeIdentities(
  principal: GovernanceAssignedToMeIdentityPrincipal,
): string[] {
  const claims = principal.meClaims ?? [];
  const actor = resolveActorLabel(principal.name, claims);
  const identities = new Map<string, string>();
  const mailbox = resolveSubmitterMailbox(actor, claims);

  if (mailbox !== null) {
    addIdentity(identities, mailbox);
  }

  if (actor.length > 0 && actor.toLowerCase() !== API_USER_ACTOR) {
    addIdentity(identities, actor);
  }

  const actorId = resolveActorId(actor, claims);

  if (actorId.toLowerCase() !== API_USER_ACTOR) {
    addIdentity(identities, actorId);
  }

  return [...identities.values()];
}

function addIdentity(identities: Map<string, string>, value: string): void {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return;
  }

  const key = trimmed.toLowerCase();

  if (!identities.has(key)) {
    identities.set(key, trimmed);
  }
}

function resolveActorLabel(name: string | null, claims: readonly MeClaim[]): string {
  const identityName = name?.trim() ?? "";

  if (identityName.length > 0) {
    return identityName;
  }

  const jwtName = getClaimValue(claims, NAME_CLAIM_TYPE)?.trim() ?? "";

  if (jwtName.length > 0) {
    return jwtName;
  }

  return API_USER_ACTOR;
}

function resolveSubmitterMailbox(actor: string, claims: readonly MeClaim[]): string | null {
  const fromEmailClaim =
    tryNormalizeMailbox(getClaimValue(claims, EMAIL_SHORT_CLAIM_TYPE))
    ?? tryNormalizeMailbox(getClaimValue(claims, EMAIL_LONG_CLAIM_TYPE));

  if (fromEmailClaim !== null) {
    return fromEmailClaim;
  }

  const fromPreferredUsername = tryNormalizeMailbox(getClaimValue(claims, PREFERRED_USERNAME_CLAIM_TYPE));

  if (fromPreferredUsername !== null) {
    return fromPreferredUsername;
  }

  const fromUpn = tryNormalizeMailbox(getClaimValue(claims, UPN_CLAIM_TYPE));

  if (fromUpn !== null) {
    return fromUpn;
  }

  return tryNormalizeMailbox(actor);
}

function resolveActorId(actor: string, claims: readonly MeClaim[]): string {
  const oid =
    getClaimValue(claims, OID_SHORT_CLAIM_TYPE)?.trim()
    ?? getClaimValue(claims, OID_LONG_CLAIM_TYPE)?.trim()
    ?? "";

  if (oid.length === 0) {
    return actor;
  }

  const tid = getClaimValue(claims, TID_CLAIM_TYPE)?.trim() ?? "";

  if (tid.length === 0) {
    return `${JWT_ACTOR_KEY_PREFIX}${oid}`;
  }

  return `${JWT_ACTOR_KEY_PREFIX}${tid}:${oid}`;
}

function getClaimValue(claims: readonly MeClaim[], claimType: string): string | null {
  const claim = claims.find((entry) => entry.type === claimType);
  const value = claim?.value?.trim() ?? "";

  return value.length > 0 ? value : null;
}

function tryNormalizeMailbox(candidate: string | null | undefined): string | null {
  const trimmed = candidate?.trim() ?? "";

  if (!trimmed.includes("@")) {
    return null;
  }

  return trimmed;
}

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase();
}

/** Case-insensitive match against risk-register assignment fields. */
export function architectureRiskRegisterEntryMatchesAssigneeIdentities(
  entry: { readonly assignedToUserId?: string | null; readonly ownerUserId?: string | null },
  identities: readonly string[],
): boolean {
  if (identities.length === 0) {
    return false;
  }

  const normalizedIdentities = new Set(identities.map(normalizeIdentity).filter((id) => id.length > 0));
  const assigned = normalizeIdentity(entry.assignedToUserId ?? "");
  const owner = normalizeIdentity(entry.ownerUserId ?? "");
  const candidate = assigned.length > 0 ? assigned : owner;

  return candidate.length > 0 && normalizedIdentities.has(candidate);
}
