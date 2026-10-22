import type { AdminUserInvitationRow } from "@/lib/admin-user-invitations";

export function isPendingAdminUserInvitation(invitation: AdminUserInvitationRow): boolean {
  return invitation.status.trim().toLowerCase() === "pending";
}

export function countPendingAdminUserInvitations(invitations: readonly AdminUserInvitationRow[]): number {
  return invitations.filter(isPendingAdminUserInvitation).length;
}

export function partitionAdminUserInvitations(invitations: readonly AdminUserInvitationRow[]): {
  readonly pending: AdminUserInvitationRow[];
  readonly resolved: AdminUserInvitationRow[];
} {
  const pending: AdminUserInvitationRow[] = [];
  const resolved: AdminUserInvitationRow[] = [];

  for (const invitation of invitations) {
    if (isPendingAdminUserInvitation(invitation)) {
      pending.push(invitation);
    } else {
      resolved.push(invitation);
    }
  }

  return { pending, resolved };
}

function toAbsoluteAcceptLink(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (typeof window === "undefined" || !window.location?.origin) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${window.location.origin}${trimmed}`;
  }

  return `${window.location.origin}/${trimmed}`;
}

export function resolveAdminUserInvitationAcceptLink(invitation: AdminUserInvitationRow): string | null {
  const acceptUrl = invitation.acceptUrl?.trim();

  if (acceptUrl) {
    return toAbsoluteAcceptLink(acceptUrl);
  }

  const acceptPath = invitation.acceptPath?.trim();

  if (acceptPath) {
    return toAbsoluteAcceptLink(acceptPath);
  }

  return null;
}

/** Preserve create-response accept secrets when the list API omits them. */
export function mergeAdminUserInvitationAcceptSecrets(
  listed: readonly AdminUserInvitationRow[],
  seeded: readonly AdminUserInvitationRow[],
): AdminUserInvitationRow[] {
  if (seeded.length === 0) {
    return [...listed];
  }

  const seedById = new Map(seeded.map((row) => [row.id, row]));
  const merged = listed.map((row) => {
    const seed = seedById.get(row.id);

    if (seed === undefined) {
      return row;
    }

    return {
      ...row,
      acceptUrl: row.acceptUrl ?? seed.acceptUrl ?? null,
      acceptPath: row.acceptPath ?? seed.acceptPath ?? null,
      invitationToken: row.invitationToken ?? seed.invitationToken ?? null,
    };
  });

  const listedIds = new Set(listed.map((row) => row.id));

  for (const seed of seeded) {
    if (!listedIds.has(seed.id)) {
      merged.unshift(seed);
    }
  }

  return merged;
}
