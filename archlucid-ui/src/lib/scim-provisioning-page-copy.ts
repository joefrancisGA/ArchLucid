/** Customer-facing copy for the SCIM provisioning settings page. */

export const SCIM_PROVISIONING_PRIMARY_CONTENT_ID = "scim-provisioning-primary-content" as const;

export const SCIM_PROVISIONING_FIRST_VIEWPORT_TEST_ID = "scim-provisioning-first-viewport" as const;

export const SCIM_PROVISIONING_SKIP_TARGET_ID = SCIM_PROVISIONING_FIRST_VIEWPORT_TEST_ID;

export const SCIM_PROVISIONING_SKIP_LINK_LABEL = "Skip to SCIM provisioning" as const;

export const SCIM_PROVISIONING_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "scim-provisioning-header-claim-discipline" as const;

export const SCIM_PROVISIONING_PAGE_TITLE = "SCIM provisioning";

export const SCIM_PROVISIONING_PAGE_SUBTITLE_OPERATOR =
  "Provision users and groups from your identity provider into ArchLucid.";

export const SCIM_PROVISIONING_PAGE_SUBTITLE_BUYER =
  "Review SCIM token posture and follow-ups for directory sync — token creation stays in the full admin workspace.";

export const SCIM_PROVISIONING_PAGE_SUBTITLE = SCIM_PROVISIONING_PAGE_SUBTITLE_OPERATOR;

export const SCIM_PROVISIONING_PAGE_LEAD =
  "Inbound SCIM token lifecycle and connectivity verification for automated user and group provisioning." as const;

export const SCIM_PROVISIONING_START_HERE_CARD_TITLE = "Start here" as const;

export const SCIM_PROVISIONING_BUYER_START_HERE_HELPER =
  "Review active token identifiers below. Create, verify, and revoke actions are hidden in buyer-polished shells — open the full admin workspace to manage credentials." as const;

export function scimProvisioningPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SCIM_PROVISIONING_PAGE_SUBTITLE_BUYER : SCIM_PROVISIONING_PAGE_SUBTITLE_OPERATOR;
}

export const SCIM_PROVISIONING_PAGE_REASSURANCE =
  "Create a token, add the ArchLucid SCIM details to your identity provider, and verify the connection before relying on automated provisioning.";

export const SCIM_CONFIGURE_SECTION_TITLE = "1. Create a SCIM token";

export const SCIM_CONFIGURE_SECTION_DESCRIPTION =
  "Create a token and add the ArchLucid SCIM endpoint and token to your identity provider's provisioning configuration.";

export const SCIM_BASE_URL_LABEL = "SCIM base URL";

export const SCIM_BASE_URL_COPY_ACTION = "Copy SCIM base URL";

export const SCIM_BASE_URL_COPIED_ACTION = "SCIM base URL copied";

export const SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING =
  "This SCIM endpoint is not reachable by an external identity provider. Use an HTTPS production URL before configuring directory sync in your identity provider.";

export const SCIM_CREATE_TOKEN_ACTION = "Create SCIM token";

export const SCIM_CREATE_DIALOG_TITLE = "Create SCIM token?";

export const SCIM_CREATE_DIALOG_DESCRIPTION =
  "This creates a live provisioning credential. ArchLucid displays the token once and cannot retrieve it later. Copy it before leaving this page.";

export const SCIM_CREATE_DIALOG_CONFIRM = "Create token";

export const SCIM_CREATE_DIALOG_CANCEL = "Cancel";

export const SCIM_CREATING_TOKEN_ACTION = "Creating SCIM token…";

export const SCIM_ONE_TIME_TOKEN_NOTICE =
  "Copy this token now. For security, ArchLucid will not display it again.";

export const SCIM_COPY_TOKEN_ACTION = "Copy token";

export const SCIM_TOKEN_COPIED_ACTION = "Token copied";

export const SCIM_TOKEN_DONE_ACTION = "Done";

export const SCIM_VERIFY_SECTION_TITLE = "2. Verify provisioning";

export const SCIM_VERIFY_SECTION_DESCRIPTION =
  "Confirm that your identity provider can connect to ArchLucid using the SCIM configuration above.";

export const SCIM_VERIFY_USING_SESSION_TOKEN =
  "We'll verify the connection using the SCIM token you just created.";

export const SCIM_VERIFY_MANUAL_TOKEN_LABEL = "SCIM token";

export const SCIM_VERIFY_MANUAL_TOKEN_HELPER_PREFIX =
  "Enter a token from your records to verify an existing configuration, or";

export const SCIM_VERIFY_MANUAL_TOKEN_HELPER_SUFFIX = "in step 1.";

export const SCIM_VERIFY_CREATE_TOKEN_LINK = "create a new token";

export const SCIM_VERIFY_DISABLED_MISSING_TOKEN =
  "Enter a SCIM token before verifying the connection.";

export const SCIM_VERIFY_ACTION = "Verify provisioning connection";

export const SCIM_VERIFYING_ACTION = "Verifying provisioning connection…";

export const SCIM_VERIFY_STATUS_NOT_VERIFIED = "Not verified";

export const SCIM_VERIFY_STATUS_FAILED = "Verification failed";

export const SCIM_VERIFY_STATUS_VERIFIED = "Connection verified";

export const SCIM_VERIFY_SUCCESS_DETAIL =
  "ArchLucid accepted the SCIM token and is ready for provisioning requests from your identity provider.";

export const SCIM_VERIFY_FAILED_GUIDANCE =
  "We could not verify the provisioning connection. Confirm that the SCIM URL and token were entered correctly in your identity provider, then try again.";

export const SCIM_VERIFY_MISSING_TOKEN =
  "Enter a SCIM token before verifying, or create a token in step 1.";

export const SCIM_VERIFY_TECHNICAL_DETAILS_TITLE = "View technical details";

export const SCIM_ACTIVE_TOKENS_SECTION_TITLE = "3. Active SCIM tokens";

export const SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION =
  "Review and revoke tokens used by identity providers to provision users and groups.";

export const SCIM_ACTIVE_TOKENS_EMPTY_TITLE = "No active SCIM tokens";

export const SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION =
  "Create a token above to begin configuring automated user and group provisioning.";

export const SCIM_TOKEN_TABLE_COLUMN_IDENTIFIER = "Token identifier";

export const SCIM_TOKEN_TABLE_COLUMN_CREATED = "Created";

export const SCIM_TOKEN_TABLE_COLUMN_STATUS = "Status";

export const SCIM_TOKEN_TABLE_COLUMN_ACTIONS = "Actions";

export const SCIM_TOKEN_STATUS_ACTIVE = "Active";

export const SCIM_TOKEN_STATUS_REVOKED = "Revoked";

export const SCIM_REVOKE_ACTION = "Revoke";

export const SCIM_REVOKING_ACTION = "Revoking…";

export const SCIM_REVOKE_DIALOG_TITLE = "Revoke SCIM token?";

export const SCIM_REVOKE_DIALOG_DESCRIPTION =
  "Revoking this token will stop provisioning requests that use it. Update your identity provider with a new token before revoking the current token if uninterrupted provisioning is required.";

export const SCIM_REVOKE_DIALOG_CONFIRM = "Revoke token";

export const SCIM_REVOKE_DIALOG_CANCEL = "Cancel";

export const SCIM_SSO_CONTEXT_NOTE_PREFIX = "Looking for sign-in configuration?";

export const SCIM_SSO_CONTEXT_NOTE_LINK = "Configure single sign-on";

export const SCIM_SSO_CONTEXT_NOTE_SUFFIX = "in Identity providers.";

export const SCIM_IDENTITY_PROVIDERS_HREF = "/administration/identity-providers";

export const SCIM_TOKEN_CREATED_SUCCESS = "SCIM token created. Copy it now, then verify the connection.";

export const SCIM_TOKEN_REVOKED_SUCCESS = "SCIM token revoked.";

export const SCIM_TOKEN_CREATE_FAILED = "Could not create SCIM token. Try again or contact your administrator.";

export const SCIM_TOKEN_REVOKE_FAILED = "Could not revoke SCIM token. Try again or contact your administrator.";

export const SCIM_TOKENS_LOAD_BLOCKED =
  "Admin access is required to manage SCIM provisioning tokens.";

export const SCIM_TOKENS_LOAD_FAILED =
  "SCIM tokens are temporarily unavailable. Refresh the page or try again later.";
