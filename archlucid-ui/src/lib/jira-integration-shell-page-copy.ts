export const JIRA_INTEGRATION_PRIMARY_CONTENT_ID = "jira-integration-primary-content" as const;

export const JIRA_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "jira-integration-first-viewport" as const;

export const JIRA_INTEGRATION_SKIP_TARGET_ID = JIRA_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const JIRA_INTEGRATION_SKIP_LINK_LABEL = "Skip to Jira workspace" as const;

export const JIRA_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "jira-integration-header-claim-discipline" as const;

export const JIRA_INTEGRATION_ORIENTATION_BOTTOM_TEST_ID = "jira-integration-orientation-bottom" as const;

export const JIRA_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Connect with Atlassian, review connection health, then save workspace routing overrides for project key, severity filters, and issue-type mapping." as const;

export const JIRA_INTEGRATION_PAGE_LEAD =
  "Connect with Atlassian and configure outbound ticket routing from architecture findings." as const;

export const JIRA_INTEGRATION_BUYER_OVERVIEW =
  "Review connection status and routing panels below, then save project key, severity filters, and issue-type mapping before treating outbound tickets as configured." as const;

export function jiraIntegrationPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? JIRA_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
