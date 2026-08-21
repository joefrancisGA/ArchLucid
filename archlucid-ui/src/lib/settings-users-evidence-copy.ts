import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SETTINGS_USERS_CANONICAL_PATH = SETTINGS_USERS_PATH;

export const SETTINGS_USERS_HELP_TOPIC_LABEL = "How users and roles work" as const;

export const SETTINGS_USERS_CLAIM_DISCIPLINE =
  "User invitations, role assignments, and API-key access on this page configure workspace membership — not a full audit export. Open Users and roles help or Assurance status before procurement.";

export const SETTINGS_USERS_SOURCES_INTRO =
  "Use these follow-ups when access setup needs role guidance, SSO configuration, or official assurance materials.";


/** Operator Sources — no self-href to the users settings page. */
export const SETTINGS_USERS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Invite a reviewer", href: `${SETTINGS_USERS_PATH}/invite-reviewer` },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
