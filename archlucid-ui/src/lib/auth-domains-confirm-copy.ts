/** Buyer-facing confirm copy for Sign-in domains destructive actions (TB-1893). */

export const AUTH_DOMAINS_ENFORCEMENT_WARNING =
  "Requiring SSO may prevent users from signing in through other methods. Confirm that the configured identity provider and recovery access have been tested." as const;

export const AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE = "Enable SSO enforcement?" as const;

export const AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE = "Change enforcement mode?" as const;

export const AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE = "Allow SSO optional?" as const;

export const AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE = "Remove recovery administrator?" as const;

/**
 * The shell switcher names a workspace, so the confirm must not imply the change is workspace-scoped.
 * The workspace is named only as one of the affected workspaces.
 */
export function authDomainsConfirmScopePhrase(currentWorkspaceLabel: string | null): string {
  if (currentWorkspaceLabel === null || currentWorkspaceLabel.length === 0) {
    return "This change applies tenant-wide, to every workspace in this organization.";
  }

  return `This change applies tenant-wide, to every workspace in this organization — including ${currentWorkspaceLabel}.`;
}

export function authDomainsEnableEnforcementConfirmDescription(currentWorkspaceLabel: string | null): string {
  return `${authDomainsConfirmScopePhrase(currentWorkspaceLabel)} ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`;
}

export function authDomainsSetEnforcementUpgradeDescription(
  currentWorkspaceLabel: string | null,
  displayDomain: string,
  modeLabel: string,
): string {
  return `${authDomainsConfirmScopePhrase(currentWorkspaceLabel)} Require ${modeLabel} for ${displayDomain}. ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`;
}

export function authDomainsSetEnforcementDowngradeDescription(
  currentWorkspaceLabel: string | null,
  displayDomain: string,
): string {
  return `${authDomainsConfirmScopePhrase(currentWorkspaceLabel)} Users on ${displayDomain} will be able to sign in without SSO once this change is saved. Confirm that loosening enforcement is intentional.`;
}
