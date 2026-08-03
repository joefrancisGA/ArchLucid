import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export const SETTINGS_USERS_CANONICAL_PATH = SETTINGS_USERS_PATH;

export const SETTINGS_USERS_CLAIM_DISCIPLINE =
  "User invitations, role assignments, and API-key access on this page configure workspace membership — they are not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Users and roles help or Security & trust before treating directory setup as assurance evidence.";

export const SETTINGS_USERS_SOURCES_INTRO =
  "Use these follow-ups when access setup needs role guidance, SSO configuration, or assurance cites.";

export type SettingsUsersSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the users settings page. */
export const SETTINGS_USERS_SOURCES: readonly SettingsUsersSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/settings/identity-providers" },
  { label: "Invite a reviewer", href: `${SETTINGS_USERS_PATH}/invite-reviewer` },
  { label: "Security & trust", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
