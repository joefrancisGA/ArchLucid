export const AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID = "aws-cloud-connection-primary-content" as const;

export const AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID = "aws-cloud-connection-first-viewport" as const;

export const AWS_CLOUD_CONNECTION_SKIP_TARGET_ID = AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID;

export const AWS_CLOUD_CONNECTION_SKIP_LINK_LABEL = "Skip to AWS connection workspace" as const;

export const AWS_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "aws-cloud-connection-header-claim-discipline" as const;

export const AWS_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID = "aws-cloud-connection-orientation-bottom" as const;

export const AWS_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER =
  "Configure read-only AWS inventory through a federated IAM role — review the security preflight, copy the trust policy, then save and validate your connection." as const;

export const AWS_CLOUD_CONNECTION_START_HERE_CARD_TITLE = "Start here" as const;

export const AWS_CLOUD_CONNECTION_START_HERE_LEAD =
  "Complete the security preflight checklist, copy the IAM trust policy starter into AWS, then enter your role ARN in Connection details and validate." as const;

export const AWS_CLOUD_CONNECTION_PAGE_LEAD =
  "Connect read-only AWS inventory through a federated IAM role — no long-lived access keys." as const;

export const AWS_CLOUD_CONNECTION_BUYER_OVERVIEW =
  "Use the start-here checklist above for security preflight and IAM trust policy setup, then complete connection details and validation below before treating inventory as authoritative." as const;

export function awsCloudConnectionPageOverview(
  buyerPolishedShell: boolean,
  operatorOverview: string,
): string {
  return buyerPolishedShell ? AWS_CLOUD_CONNECTION_PAGE_SUBTITLE_BUYER : operatorOverview;
}
