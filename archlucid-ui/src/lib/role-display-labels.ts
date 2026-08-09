/**
 * Buyer-facing labels for built-in workspace roles.
 *
 * The claim/API role id is authoritative and unchanged (`Operator`); the UI glossary displays that
 * role as "Architect". Identity providers are still configured with the claim value, so any admin
 * surface showing the display label should also disclose the claim value via `roleClaimCaption`.
 *
 * This module must not import from role matrix constants — those constants read labels from here.
 */
export const BUILTIN_ROLE_DISPLAY_LABELS: Readonly<Record<string, string>> = {
  Admin: "Admin",
  Operator: "Architect",
  Reader: "Reader",
  Auditor: "Auditor",
};

/** Buyer-facing label for an API/claim role name. Custom and unknown role names pass through unchanged. */
export function roleDisplayLabel(apiRoleName: string | null | undefined): string {
  if (apiRoleName === null || apiRoleName === undefined)
    return "";

  return BUILTIN_ROLE_DISPLAY_LABELS[apiRoleName] ?? apiRoleName;
}

/** True when the displayed label differs from the claim value an identity provider must send. */
export function roleDisplayLabelDiffersFromClaim(apiRoleName: string | null | undefined): boolean {
  if (apiRoleName === null || apiRoleName === undefined || apiRoleName.length === 0)
    return false;

  return roleDisplayLabel(apiRoleName) !== apiRoleName;
}

/** Secondary caption disclosing the claim value, or null when label and claim value already match. */
export function roleClaimCaption(apiRoleName: string | null | undefined): string | null {
  if (!roleDisplayLabelDiffersFromClaim(apiRoleName))
    return null;

  return `Claim value: ${apiRoleName}`;
}
