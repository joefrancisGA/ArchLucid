import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SETTINGS_ROLES_SETTINGS_CANONICAL_PATH = "/administration/users" as const;

export const SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const SETTINGS_ROLES_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const SETTINGS_ROLES_SETTINGS_CLAIM_HEADING_ID = "settings-roles-settings-claim-discipline-heading" as const;

export const SETTINGS_ROLES_SETTINGS_CLAIM_DISCIPLINE =
  "This Users and roles page manages workspace membership and role assignment — access configuration only, not a full audit export. Open Audit trail or Assurance status when you need sealed-record evidence.";

export const SETTINGS_ROLES_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when invitations turn into identity-provider setup, audit review, or official assurance materials.";


/** Operator Sources — no self-href to `/administration/users`. */
export const SETTINGS_ROLES_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "SSO and identity", href: "/administration/identity-providers" },
  { label: "Invite a reviewer", href: "/administration/users/invite-reviewer" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
