/** Buyer-facing confirm copy for Sign-in domains destructive actions (TB-1893). */

export const AUTH_DOMAINS_ENFORCEMENT_WARNING =
  "Requiring SSO may prevent users from signing in through other methods. Confirm that the configured identity provider and recovery access have been tested." as const;

export const AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE = "Enable SSO enforcement?" as const;

export const AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE = "Change enforcement mode?" as const;

export const AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE = "Allow SSO optional?" as const;

export const AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE = "Remove recovery administrator?" as const;

export function authDomainsConfirmScopePhrase(organizationLabel: string): string {
  return `This change applies tenant-wide to sign-in domains for ${organizationLabel}.`;
}

export function authDomainsEnableEnforcementConfirmDescription(organizationLabel: string): string {
  return `${authDomainsConfirmScopePhrase(organizationLabel)} ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`;
}

export function authDomainsSetEnforcementUpgradeDescription(
  organizationLabel: string,
  displayDomain: string,
  modeLabel: string,
): string {
  return `${authDomainsConfirmScopePhrase(organizationLabel)} Require ${modeLabel} for ${displayDomain}. ${AUTH_DOMAINS_ENFORCEMENT_WARNING}`;
}

export function authDomainsSetEnforcementDowngradeDescription(
  organizationLabel: string,
  displayDomain: string,
): string {
  return `${authDomainsConfirmScopePhrase(organizationLabel)} Users on ${displayDomain} will be able to sign in without SSO once this change is saved. Confirm that loosening enforcement is intentional.`;
}
