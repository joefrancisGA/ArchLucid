import { describe, expect, it } from "vitest";

import {
  SLACK_INTEGRATION_HELP_BUYER_OVERVIEW,
  SLACK_INTEGRATION_HELP_PAGE_LEAD,
} from "@/lib/slack-integration-help-page-copy";
import { SLACK_INTEGRATION_HELP_BUYER_START_HERE_HELPER } from "@/lib/slack-integration-help-guide-content";

describe("slack-integration-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(SLACK_INTEGRATION_HELP_BUYER_OVERVIEW).not.toBe(SLACK_INTEGRATION_HELP_PAGE_LEAD);
    expect(SLACK_INTEGRATION_HELP_BUYER_OVERVIEW).not.toBe(SLACK_INTEGRATION_HELP_BUYER_START_HERE_HELPER);
  });
});
