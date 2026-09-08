import {
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
} from "@/lib/alerts-page-copy";
import { AUDIT_TRAIL_PAGE_TITLE } from "@/lib/audit-trail-page-copy";

export const GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID = "governance-audit-primary-content" as const;

export const GOVERNANCE_AUDIT_SKIP_LINK_LABEL = "Skip to audit trail" as const;

export const GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_LABEL = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL;

export const GOVERNANCE_AUDIT_BREADCRUMB_GOVERNANCE_HREF = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF;

export const GOVERNANCE_AUDIT_BREADCRUMB_TOPIC_TITLE = AUDIT_TRAIL_PAGE_TITLE;

export const GOVERNANCE_AUDIT_LOAD_ERROR =
  "Could not load audit events for this workspace. Try again in a moment." as const;

export const GOVERNANCE_AUDIT_LOAD_ERROR_RETRY_LABEL = "Try again" as const;

/** Buyer-facing copy for `/governance/audit` (AUD). */
export const GOVERNANCE_AUDIT_PAGE_LEAD =
  "Browse workspace audit events for approvals, decisions, exports, and configuration changes.";

export const GOVERNANCE_AUDIT_BUYER_START_HERE_HELPER =
  "Pick a review or run a search below — export tools in the header help when you need tamper-evident records.";
