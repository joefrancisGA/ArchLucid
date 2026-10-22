import { describe, expect, it } from "vitest";

import { interpretSlackIntegrationTestResult } from "@/lib/slack-integration-test-feedback";
import {
  SLACK_INTEGRATION_TEST_FAILURE,
  SLACK_INTEGRATION_TEST_SUCCESS,
} from "@/lib/slack-integration-page-copy";

describe("interpretSlackIntegrationTestResult", () => {
  it("returns success for 2xx transport", () => {
    const feedback = interpretSlackIntegrationTestResult({
      transportSucceeded: true,
      statusCode: 204,
      responseBodyTruncated: false,
    });

    expect(feedback).toEqual({ kind: "success", message: SLACK_INTEGRATION_TEST_SUCCESS });
  });

  it("returns error with the HTTP status for non-2xx transport", () => {
    const feedback = interpretSlackIntegrationTestResult({
      transportSucceeded: true,
      statusCode: 500,
      responseBodyTruncated: false,
    });

    expect(feedback).toEqual({
      kind: "error",
      message: `${SLACK_INTEGRATION_TEST_FAILURE} Slack returned HTTP 500.`,
    });
  });

  it("defaults a missing statusCode to 0 instead of rendering undefined", () => {
    const feedback = interpretSlackIntegrationTestResult({
      transportSucceeded: true,
      responseBodyTruncated: false,
    });

    expect(feedback).toEqual({
      kind: "error",
      message: `${SLACK_INTEGRATION_TEST_FAILURE} Slack returned HTTP 0.`,
    });
  });

  it("returns the generic failure message when transport fails", () => {
    const feedback = interpretSlackIntegrationTestResult({
      transportSucceeded: false,
      statusCode: 0,
      responseBodyTruncated: false,
    });

    expect(feedback).toEqual({ kind: "error", message: SLACK_INTEGRATION_TEST_FAILURE });
  });
});
