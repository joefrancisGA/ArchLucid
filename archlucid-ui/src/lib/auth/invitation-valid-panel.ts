import { BUILTIN_ROLE_DISPLAY_LABELS, roleClaimCaption, roleDisplayLabel } from "@/lib/role-display-labels";

export type InvitationAppRolePresentation = {
  readonly label: string;
  readonly claimCaption: string | null;
};

/** Maps known invitation `appRole` values to buyer-safe labels; hides unknown enum strings (TB-1475). */
export function resolveInvitationAppRolePresentation(
  appRole: string | null | undefined,
): InvitationAppRolePresentation | null {
  if (appRole === null || appRole === undefined) {
    return null;
  }

  const trimmed = appRole.trim();

  if (trimmed.length === 0 || !(trimmed in BUILTIN_ROLE_DISPLAY_LABELS)) {
    return null;
  }

  return {
    label: roleDisplayLabel(trimmed),
    claimCaption: roleClaimCaption(trimmed),
  };
}
