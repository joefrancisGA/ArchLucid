import { describe, expect, it } from "vitest";

import {
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";

describe("slackIntegrationConfigurationStatusTagKind", () => {
  it("marks zero active destinations as needs-attention", () => {
    expect(slackIntegrationConfigurationStatusTagKind(0)).toBe("needs-attention");
    expect(slackIntegrationConfigurationStatusLabel(0)).toBe("Not configured");
  });

  it("marks one or more active destinations as ready", () => {
    expect(slackIntegrationConfigurationStatusTagKind(1)).toBe("ready");
    expect(slackIntegrationConfigurationStatusLabel(1)).toBe("1 active destination");
    expect(slackIntegrationConfigurationStatusTagKind(3)).toBe("ready");
    expect(slackIntegrationConfigurationStatusLabel(3)).toBe("3 active destinations");
  });
});
