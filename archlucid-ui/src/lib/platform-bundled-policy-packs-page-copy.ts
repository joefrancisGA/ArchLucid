import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

export const PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE = "Platform policy packs" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_PAGE_SUBTITLE =
  "Activate or deactivate bundled policy packs for every tenant. Deactivated packs disappear from tenant workspaces and no longer apply to reviews." as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_TABLE_ARIA_LABEL = "Platform bundled policy packs" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_TITLE = "No bundled policy packs" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_DESCRIPTION =
  "Bundled pack registry rows appear here after platform bootstrap. If this stays empty, check deployment status or reload." as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_TITLE = "No packs match filters" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_DESCRIPTION =
  "Clear the name filter or choose a different category facet." as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_LABEL = "Scope" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_ACTIVE =
  "All tenants when globally active" as const;

export const PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_DEACTIVATED =
  "Hidden from tenant workspaces when deactivated" as const;

export const PLATFORM_BUNDLED_POLICY_PACK_AUDIT_HREF = GOVERNANCE_AUDIT_PATH;

export const PLATFORM_BUNDLED_POLICY_PACK_AUDIT_LINK_LABEL = "Open audit trail" as const;

export const PLATFORM_BUNDLED_POLICY_PACK_ACTIVATE_CONFIRM_LABEL = "Activate globally" as const;

export const PLATFORM_BUNDLED_POLICY_PACK_DEACTIVATE_CONFIRM_LABEL = "Deactivate globally" as const;

export function platformBundledPolicyPackActivateDialogTitle(displayName: string): string {
  return `Activate "${displayName}" globally?`;
}

export function platformBundledPolicyPackDeactivateDialogTitle(displayName: string): string {
  return `Deactivate "${displayName}" globally?`;
}

export function platformBundledPolicyPackActivateDialogDescription(displayName: string): string {
  return `Turn on "${displayName}" for every tenant. Tenant workspaces can opt in or out only while the pack stays globally active.`;
}

export function platformBundledPolicyPackDeactivateDialogDescription(displayName: string): string {
  return `Turn off "${displayName}" for every tenant. Deactivated packs disappear from tenant workspaces and no longer apply to reviews.`;
}

export function platformBundledPolicyPackActivateButtonLabel(displayName: string): string {
  return `Activate globally — ${displayName}`;
}

export function platformBundledPolicyPackDeactivateButtonLabel(displayName: string): string {
  return `Deactivate globally — ${displayName}`;
}

export function platformBundledPolicyPackToggleSuccessMessage(displayName: string, active: boolean): string {
  if (active) {
    return `${displayName} is now active globally.`;
  }

  return `${displayName} is deactivated globally.`;
}

export function platformBundledPolicyPackListLoadFailureMessage(cause: string): string {
  return cause.trim().length > 0 ? cause : "Bundled policy pack registry is temporarily unavailable.";
}
