import { describe, expect, it } from "vitest";

import {
  filterHelpSearchPanelTopics,
  helpSearchPanelTopicHasBannedPublicCopy,
  listHelpSearchPanelTopics,
  recommendedHelpSearchPanelTopicIds,
} from "@/lib/help-search-panel-catalog";

describe("help-search-panel-catalog", () => {
  it("recommends first-review topics on overview", () => {
    expect(recommendedHelpSearchPanelTopicIds("/")).toEqual([
      "first-review-guide",
      "create-first-review",
      "sample-review",
    ]);
  });

  it("recommends cloud connection topics on integrations route", () => {
    expect(recommendedHelpSearchPanelTopicIds("/integrations/cloud-connections")).toEqual([
      "cloud-connections",
      "connect-azure",
      "troubleshoot",
    ]);
  });

  it("filters topics by alias synonyms", () => {
    const topics = listHelpSearchPanelTopics(false);
    const hits = filterHelpSearchPanelTopics(topics, "proof packet");

    expect(hits.map((topic) => topic.id)).toContain("review-artifacts");
  });

  it("hides admin-only topics for non-admin callers", () => {
    const architectTopics = listHelpSearchPanelTopics(false);

    expect(architectTopics.map((topic) => topic.id)).not.toContain("admin-diagnostics");
    expect(architectTopics.map((topic) => topic.id)).not.toContain("advanced-diagnostics");
  });

  it("exposes admin diagnostics topics for admin callers", () => {
    const adminTopics = listHelpSearchPanelTopics(true);

    expect(adminTopics.map((topic) => topic.id)).toContain("admin-diagnostics");
    expect(adminTopics.map((topic) => topic.id)).toContain("advanced-diagnostics");
  });

  it("keeps default architect-facing topics free of banned public copy", () => {
    for (const topic of listHelpSearchPanelTopics(false)) {
      expect(helpSearchPanelTopicHasBannedPublicCopy(topic), topic.id).toBe(false);
    }
  });
});
