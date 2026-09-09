export const SERVICENOW_INTEGRATION_PRIMARY_CONTENT_ID = "servicenow-integration-primary-content" as const;

export const SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "servicenow-integration-first-viewport" as const;

export const SERVICENOW_INTEGRATION_SKIP_TARGET_ID = SERVICENOW_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const SERVICENOW_INTEGRATION_SKIP_LINK_LABEL = "Skip to ServiceNow workspace" as const;

export const SERVICENOW_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "servicenow-integration-header-claim-discipline" as const;

export const SERVICENOW_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID = "servicenow-integration-orientation-bottom" as const;

export const SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Review connection health, confirm instance credentials, then save incident creation settings and test connectivity before routing findings to ServiceNow." as const;

export const SERVICENOW_INTEGRATION_PAGE_LEAD =
  "Connect ServiceNow and configure outbound incident routing from architecture findings." as const;

export const SERVICENOW_INTEGRATION_BUYER_OVERVIEW =
  "Review connection status and incident settings below, then save CMDB and routing preferences and test connectivity before treating outbound incidents as configured." as const;

export function servicenowIntegrationPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? SERVICENOW_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
