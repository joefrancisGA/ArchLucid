import { describe, expect, it } from "vitest";

import { getDocHref, getHelpTopicHref, helpTopicsForGuidesTab, HELP_TOPICS } from "@/lib/help/help-topics";

describe("getDocHref", () => {
  it("maps known repo paths to in-app help routes", () => {
    expect(getDocHref("docs/library/FIRST_RUN_WIZARD.md")).toBe("/help/getting-started");
    expect(getDocHref("docs/library/ALERTS.md")).toBe("/help/alerts");
  });

  it("preserves hash fragments on in-app routes", () => {
    expect(getDocHref("docs/library/customer-facing/OPERATOR_QUICKSTART.md#operator-ui")).toBe(
      "/help/cli-usage#operator-ui",
    );
  });

  it("strips leading slash from the path before resolving", () => {
    expect(getDocHref("/docs/library/COMPARISON_REPLAY.md")).toBe("/help/comparison-replay");
  });

  it("returns null for unmapped doc paths", () => {
    expect(getDocHref("/docs/X.md")).toBeNull();
    expect(getDocHref("docs/BUILD.md")).toBeNull();
  });

  it("maps internal runbooks registered in product documentation", () => {
    expect(getDocHref("docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md")).toBe(
      "/help/first-architecture-review#first-value-in-20-minutes",
    );
  });

  it("returns null when docPath is empty or whitespace", () => {
    expect(getDocHref("")).toBeNull();
    expect(getDocHref("   ")).toBeNull();
  });
});

describe("HELP_TOPICS buyer governance links (TB-1387)", () => {
  it("routes governance golden-path topics to buyer help, not eng API contracts", () => {
    const topicIds = ["governance-workflow", "policy-packs"] as const;

    for (const topicId of topicIds) {
      const topic = HELP_TOPICS.find((entry) => entry.id === topicId);

      expect(topic, topicId).toBeDefined();
      expect(topic!.docPath.toLowerCase()).not.toContain("api_contracts");

      const href = getHelpTopicHref(topic!);

      expect(href, topicId).not.toBeNull();
      expect(href!).not.toContain("governance-api-contracts");
    }

    expect(getHelpTopicHref(HELP_TOPICS.find((entry) => entry.id === "governance-workflow")!)).toBe(
      "/help/governance-approval",
    );
  });
});

describe("helpTopicsForGuidesTab host configuration", () => {
  it("omits Configuration summary from the Help drawer for tenant-admin shells", () => {
    expect(helpTopicsForGuidesTab().some((topic) => topic.id === "admin-configuration")).toBe(false);
  });
});
