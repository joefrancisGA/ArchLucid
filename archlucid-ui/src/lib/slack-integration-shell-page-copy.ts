export const SLACK_INTEGRATION_PRIMARY_CONTENT_ID = "slack-integration-primary-content" as const;

export const SLACK_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "slack-integration-first-viewport" as const;

export const SLACK_INTEGRATION_SKIP_TARGET_ID = SLACK_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const SLACK_INTEGRATION_SKIP_LINK_LABEL = "Skip to Slack workspace" as const;

export const SLACK_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "slack-integration-header-claim-discipline" as const;

export const SLACK_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Add Slack incoming-webhook destinations, verify delivery with a test notification, and manage which alert events post to your channels." as const;

export function slackIntegrationPageSubtitle(buyerPolishedShell: boolean, operatorSubtitle: string): string {
  return buyerPolishedShell ? SLACK_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorSubtitle;
}
