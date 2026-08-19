import {
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
} from "@/lib/alerts-page-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const ALERTS_INBOX_PRIMARY_CONTENT_ID = "alerts-inbox-primary-content" as const;

export const ALERTS_INBOX_SKIP_LINK_LABEL = "Skip to alert inbox" as const;

export const ALERTS_INBOX_BREADCRUMB_GOVERNANCE_LABEL = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL;

export const ALERTS_INBOX_BREADCRUMB_GOVERNANCE_HREF = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF;

export const ALERTS_INBOX_BREADCRUMB_TOPIC_TITLE = OPERATOR_NAV_LINK_LABELS.alerts;

export const ALERTS_INBOX_LOAD_ERROR =
  "Could not load alerts for this workspace. Try again in a moment." as const;

export const ALERTS_INBOX_LOAD_ERROR_RETRY_LABEL = "Try again" as const;
