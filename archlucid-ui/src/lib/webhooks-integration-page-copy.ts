export const WEBHOOKS_INTEGRATION_PRIMARY_CONTENT_ID = "webhooks-integration-primary-content" as const;

export const WEBHOOKS_INTEGRATION_FIRST_VIEWPORT_TEST_ID = "webhooks-integration-first-viewport" as const;

export const WEBHOOKS_INTEGRATION_SKIP_TARGET_ID = WEBHOOKS_INTEGRATION_FIRST_VIEWPORT_TEST_ID;

export const WEBHOOKS_INTEGRATION_SKIP_LINK_LABEL = "Skip to webhooks workspace" as const;

export const WEBHOOKS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "webhooks-integration-header-claim-discipline" as const;

export const WEBHOOKS_INTEGRATION_PAGE_SUBTITLE_BUYER =
  "Create webhook subscriptions, verify your endpoint with a test event, and manage which alert events post to your HTTPS receiver." as const;

export function webhooksIntegrationPageDescription(
  buyerPolishedShell: boolean,
  operatorDescription: string,
): string {
  return buyerPolishedShell ? WEBHOOKS_INTEGRATION_PAGE_SUBTITLE_BUYER : operatorDescription;
}
