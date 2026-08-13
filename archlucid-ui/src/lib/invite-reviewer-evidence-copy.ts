import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const INVITE_REVIEWER_CANONICAL_PATH = `${SETTINGS_USERS_PATH}/invite-reviewer` as const;

export const INVITE_REVIEWER_HELP_TOPIC_LABEL = "How to invite a reviewer" as const;

export const INVITE_REVIEWER_CLAIM_DISCIPLINE =
  "Inviting a reviewer grants Reader or Auditor access for architecture review sign-off — it is not a signed-review diligence Sources package. Open Users and roles or Users and roles help when you need the full directory and role matrix.";

export const INVITE_REVIEWER_SOURCES_INTRO =
  "Use these follow-ups when an invitation needs directory management, role guidance, or SSO prerequisites.";


/** Operator Sources — no self-href to invite-reviewer. */
export const INVITE_REVIEWER_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles", href: SETTINGS_USERS_PATH },
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
