import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export function adminUserInvitationStatusKind(status: string): EnterpriseStatusKind {
  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") {
    return "in-progress";
  }

  if (normalized === "accepted") {
    return "approved";
  }

  if (normalized === "revoked" || normalized === "expired") {
    return "blocked";
  }

  return "neutral";
}
