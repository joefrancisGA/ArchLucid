import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

export const API_KEYS_PAGE_TITLE = "API keys";

export const API_KEYS_PAGE_SUBTITLE =
  "Manage API keys used for approved automation and integration access.";

export const API_KEYS_ENTERPRISE_ONLY_NOTICE =
  "API key access is available only for approved internal or enterprise configurations.";

export const API_KEYS_RESTRICTED_TITLE = "API key management is restricted";

export const API_KEYS_RESTRICTED_DESCRIPTION =
  "API key management is available to workspace administrators.";

export const API_KEYS_SURFACE_DISABLED_TITLE = "API keys are not managed in this release.";

export const API_KEYS_SURFACE_DISABLED_DESCRIPTION =
  "People access is managed under Users and roles. Host automation credentials are held in deployment configuration.";

export const API_KEYS_FORBIDDEN_EMPTY_BODY =
  "If you need API key access for an approved integration, ask a workspace administrator or your ArchLucid contact to enable enterprise configuration.";

export const API_KEYS_SSO_ONLY_NOTICE =
  "This workspace uses SSO-managed sign-in. API keys may be disabled when your organization requires identity-provider authentication only.";

export const API_KEYS_SUMMARY_ACCESS_LABEL = "API key access";
export const API_KEYS_SUMMARY_ADMIN_KEYS_LABEL = "Active admin keys";
export const API_KEYS_SUMMARY_READONLY_KEYS_LABEL = "Active read-only keys";
export const API_KEYS_SUMMARY_LAST_ROTATION_LABEL = "Last rotation";
export const API_KEYS_SUMMARY_LAST_USED_LABEL = "Last used";

export const API_KEYS_ACCESS_ENABLED_LABEL = "Enabled";
export const API_KEYS_ACCESS_DISABLED_LABEL = "Disabled";

export const API_KEYS_CREDENTIALS_SECTION_TITLE = "Managed credentials";
export const API_KEYS_RECENT_EVENTS_SECTION_TITLE = "Recent key events";
export const API_KEYS_RECENT_EVENTS_EMPTY = "No key events recorded in this session.";

export const API_KEYS_ONE_TIME_COPY_NOTICE =
  "Copy this key now. ArchLucid will not show it again.";

export function apiKeysOneTimeCopyNotice(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, API_KEYS_ONE_TIME_COPY_NOTICE);
}

export const API_KEYS_ROTATE_SUCCESS_ADMIN = "Admin key rotated";
export const API_KEYS_ROTATE_SUCCESS_READONLY = "Read-only key rotated";
export const API_KEYS_OVERLAP_SUCCESS = "Overlap key issued";
export const API_KEYS_ROTATE_FAILED = "Key rotation failed";

export const API_KEYS_ACTION_ISSUE_OVERLAP = "Issue overlap key";
export const API_KEYS_ACTION_ROTATE_READONLY = "Rotate read-only key";
export const API_KEYS_ACTION_ROTATE_ADMIN = "Rotate admin key";
export const API_KEYS_ACTION_VIEW_AUDIT = "View audit events";

export const API_KEYS_CONFIRM_ROTATE_ADMIN_TITLE = "Rotate admin key?";
export const API_KEYS_CONFIRM_ROTATE_ADMIN_DESCRIPTION =
  "This replaces the current admin key. Integrations using the old key will stop working after deployment.";

export const API_KEYS_CONFIRM_ROTATE_READONLY_TITLE = "Rotate read-only key?";
export const API_KEYS_CONFIRM_ROTATE_READONLY_DESCRIPTION =
  "This replaces the current read-only key. Update integrations before removing the previous value.";

export const API_KEYS_CONFIRM_OVERLAP_TITLE = "Issue overlap key?";
export const API_KEYS_CONFIRM_OVERLAP_DESCRIPTION =
  "Issues a second admin key so you can rotate without downtime. Remove the previous key after integrations are updated.";

export const API_KEYS_CONFIRM_TYPE_PHRASE_ADMIN = "Rotate admin key";

export const API_KEYS_TECHNICAL_DETAILS_TITLE = "Technical details";
export const API_KEYS_TECHNICAL_DETAILS_DESCRIPTION =
  "Internal configuration references for support and deployment workflows.";

export const API_KEYS_TABLE_COLUMN_NAME = "Key name";
export const API_KEYS_TABLE_COLUMN_PERMISSION = "Permission level";
export const API_KEYS_TABLE_COLUMN_CREATED = "Created";
export const API_KEYS_TABLE_COLUMN_LAST_USED = "Last used";
export const API_KEYS_TABLE_COLUMN_EXPIRES = "Expires";
export const API_KEYS_TABLE_COLUMN_STATUS = "Status";
export const API_KEYS_TABLE_COLUMN_ACTIONS = "Actions";

export const API_KEYS_AUDIT_COLUMN_TIME = "Time";
export const API_KEYS_AUDIT_COLUMN_ACTOR = "Actor";
export const API_KEYS_AUDIT_COLUMN_ACTION = "Action";
export const API_KEYS_AUDIT_COLUMN_KEY_NAME = "Key name";
export const API_KEYS_AUDIT_COLUMN_OUTCOME = "Outcome";

export const API_KEYS_ADMIN_KEY_NAME = "Admin key";
export const API_KEYS_READONLY_KEY_NAME = "Read-only key";

export const API_KEYS_PERMISSION_ADMIN = "Full administration";
export const API_KEYS_PERMISSION_READONLY = "Read-only";

export const API_KEYS_STATUS_ACTIVE = "Active";
export const API_KEYS_STATUS_NOT_CONFIGURED = "Not configured";
export const API_KEYS_STATUS_EXPIRED = "Expired";

export const API_KEYS_AUDIT_ACTOR_SELF = "You";
