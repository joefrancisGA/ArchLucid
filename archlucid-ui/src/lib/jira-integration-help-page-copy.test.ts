import { describe, expect, it } from "vitest";

import {
  JIRA_INTEGRATION_HELP_BUYER_OVERVIEW,
  JIRA_INTEGRATION_HELP_PAGE_LEAD,
  JIRA_INTEGRATION_HELP_START_HERE_HELPER,
} from "@/lib/jira-integration-help-page-copy";

describe("jira-integration-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(JIRA_INTEGRATION_HELP_BUYER_OVERVIEW).not.toBe(JIRA_INTEGRATION_HELP_PAGE_LEAD);
    expect(JIRA_INTEGRATION_HELP_BUYER_OVERVIEW).not.toBe(JIRA_INTEGRATION_HELP_START_HERE_HELPER);
  });
});
