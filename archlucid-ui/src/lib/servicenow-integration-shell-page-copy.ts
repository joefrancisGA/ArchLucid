export const SERVICENOW_INTEGRATION_PRIMARY_CONTENT_ID = "servicenow-integration-primary-content" as const;

export const SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "servicenow-integration-first-viewport" as const;

export const SERVICENOW_INTEGRATION_SKIP_TARGET_ID = SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const SERVICENOW_INTEGRATION_SKIP_LINK_LABEL = "Skip to ServiceNow workspace" as const;

export const SERVICENOW_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "servicenow-integration-header-claim-discipline" as const;

export const SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Review connection health, confirm instance credentials, then save incident creation settings and test connectivity before routing findings to ServiceNow." as const;

export function servicenowIntegrationPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
