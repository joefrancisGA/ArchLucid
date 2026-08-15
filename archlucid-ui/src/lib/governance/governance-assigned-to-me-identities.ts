import type { CurrentPrincipal } from "@/lib/current-principal";

/** Mirrors server `ArchitectureRiskRegisterAssignedToMeIdentityResolver` with client `/me` fields. */
export function resolveGovernanceAssignedToMeIdentities(
  principal: Pick<CurrentPrincipal, "name">,
): string[] {
  const identities: string[] = [];
  const name = principal.name?.trim() ?? "";

  if (name.length > 0) {
    identities.push(name);
  }

  return identities;
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
