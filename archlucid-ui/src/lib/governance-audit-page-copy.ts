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
