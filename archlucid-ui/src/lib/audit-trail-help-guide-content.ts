import {
  AUDIT_TRAIL_HOW_IT_WORKS_BODY,
  AUDIT_TRAIL_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR,
} from "@/lib/audit-trail-page-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";

export const AUDIT_TRAIL_HELP_PAGE_TITLE = "Audit trail";

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE =
  "Immutable audit events, correlation identifiers, and buyer-safe export posture.";

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER = AUDIT_TRAIL_PAGE_SUBTITLE_BUYER;

export const AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR = AUDIT_TRAIL_PAGE_SUBTITLE_OPERATOR;

export function auditTrailHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER : AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR;
}

export const AUDIT_TRAIL_HELP_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const AUDIT_TRAIL_HELP_ACTION_REFRESH = "Refresh" as const;

export const AUDIT_TRAIL_HELP_ACTION_REFRESHING = "Refreshing…" as const;

export const AUDIT_TRAIL_HELP_SCOPE_DETAILS_TRIGGER = "About audit trails" as const;

export const AUDIT_TRAIL_HELP_OVERVIEW = AUDIT_TRAIL_HOW_IT_WORKS_BODY;

export const AUDIT_TRAIL_HELP_PRIMARY_ACTIONS = {
  openAuditTrail: {
    label: "Open audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
  governanceApproval: {
    label: "Governance approval",
    href: "/help/governance-approval",
  },
  securityTrust: {
    label: "Security and trust",
    href: "/help/security-trust",
  },
} as const;
