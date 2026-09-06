/** Canonical copy for the workspace invitation accept route (`/auth/invite`). */
export const AUTH_INVITE_PAGE_TITLE = "Accept workspace invitation";

export const AUTH_INVITE_PAGE_DESCRIPTION =
  "Validate your workspace invitation and continue to sign in before joining your organization.";

export const AUTH_INVITE_PAGE_LEAD =
  "Sign in to accept your invitation. We never grant access until you authenticate and confirm.";

export const AUTH_INVITE_LOADING_DETAIL = "Validating your invitation…";

export const AUTH_INVITE_PRIMARY_CONTENT_ID = "auth-invite-primary-content" as const;

export const AUTH_INVITE_SKIP_LINK_LABEL = "Skip to invitation accept content" as const;

export const AUTH_INVITE_BREADCRUMB_HUB_LABEL = "Welcome" as const;

export const AUTH_INVITE_BREADCRUMB_HUB_PATH = "/welcome" as const;

export const AUTH_INVITE_BREADCRUMB_TOPIC_TITLE = AUTH_INVITE_PAGE_TITLE;

/** Report Problem title when invitation validation cannot complete on `/auth/invite`. */
export const AUTH_INVITE_VALIDATION_FAILURE_TITLE = "Invitation could not be validated";
