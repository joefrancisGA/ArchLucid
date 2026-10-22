import type { WebhookTestResponse } from "@/types/alert-routing";

import {
  SLACK_INTEGRATION_TEST_FAILURE,
  SLACK_INTEGRATION_TEST_SUCCESS,
} from "@/lib/slack-integration-page-copy";

export type SlackIntegrationTestFeedback = {
  readonly kind: "success" | "error";
  readonly message: string;
};

export function interpretSlackIntegrationTestResult(result: WebhookTestResponse): SlackIntegrationTestFeedback {
  const statusCode = result.statusCode ?? 0;

  if (result.transportSucceeded && statusCode >= 200 && statusCode < 300) {
    return { kind: "success", message: SLACK_INTEGRATION_TEST_SUCCESS };
  }

  if (result.transportSucceeded) {
    return {
      kind: "error",
      message: `${SLACK_INTEGRATION_TEST_FAILURE} Slack returned HTTP ${statusCode}.`,
    };
  }

  return {
    kind: "error",
    message: SLACK_INTEGRATION_TEST_FAILURE,
  };
}
