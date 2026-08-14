/**
 * TB-2240 — canonical customer-facing persona labels.
 * Internal route groups (`(operator)`), API values, and persisted `operator` mode stay unchanged.
 */
export const PRIMARY_ARCHITECT_PERSONA = {
  id: "architect",
  label: "Architect",
  workspaceLabel: "Architect workspace",
  workspaceMapLabel: "Architect workspace map",
  workspaceUiMapLabel: "Architect workspace (UI map)",
  defaultDocumentTitle: "ArchLucid workspace",
  wordmarkAriaLabel: "ArchLucid — go to Overview",
  signOutHomeAriaLabel: "Sign out and return to Overview",
  openInViewLabel: "Open in architect view",
  handoffLinkLabel: "Open in Architect →",
  shellSwitchAriaLabel: "Switch shell view",
} as const;

export const PRIMARY_SPONSOR_PERSONA = {
  id: "sponsor",
  label: "Sponsor",
} as const;

/**
 * Standalone persona nouns that must not appear in customer-facing nav, route titles, or help copy.
 * Code identifiers (`operator-admin`, `OPERATOR_NAV_*`) are out of scope.
 */
export const BANNED_STANDALONE_CUSTOMER_PERSONA_NOUNS = ["operator"] as const;

export type BannedStandaloneCustomerPersonaNoun = (typeof BANNED_STANDALONE_CUSTOMER_PERSONA_NOUNS)[number];

const bannedPersonaPattern = new RegExp(
  `\\b(?:${BANNED_STANDALONE_CUSTOMER_PERSONA_NOUNS.join("|")})\\b`,
  "i",
);

/** Returns true when copy uses a retired standalone persona noun in customer surfaces. */
export function containsBannedStandaloneCustomerPersonaNoun(copy: string): boolean {
  return bannedPersonaPattern.test(copy);
}
