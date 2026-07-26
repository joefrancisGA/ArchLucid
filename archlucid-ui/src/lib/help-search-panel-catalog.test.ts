import { describe, expect, it } from "vitest";

import {
  filterHelpSearchPanelTopics,
  HELP_SEARCH_PANEL_MAX_RECOMMENDED,
  helpSearchPanelTopicHasBannedPublicCopy,
  helpSearchPanelTopicTargetsCurrentPage,
  listHelpSearchPanelTopics,
  recommendedHelpSearchPanelTopicIds,
  recommendedHelpSearchPanelTopics,
  splitHelpSearchPanelDoThisNow,
} from "@/lib/help-search-panel-catalog";

describe("help-search-panel-catalog", () => {
  it("recommends first-review topics on overview", () => {
    expect(recommendedHelpSearchPanelTopicIds("/")).toEqual([
      "getting-started-help",
      "how-archlucid-works",
      "first-review-guide",
      "product-faq",
      "create-first-review",
    ]);
  });

  it("recommends next-step actions on core-pilot instead of first-review relaunches (TB-1044)", () => {
    expect(recommendedHelpSearchPanelTopicIds("/help/core-pilot")).toEqual([
      "create-first-review",
      "sample-review",
      "upload-evidence",
      "cloud-connections",
      "troubleshoot",
    ]);

    const titles = recommendedHelpSearchPanelTopics("/help/core-pilot", false).map((topic) => topic.title);

    expect(titles).not.toContain("Getting started");
    expect(titles).not.toContain("How ArchLucid works");
    expect(titles).not.toContain("First review guide");
    expect(titles).toContain("Create your first review");
    expect(titles).toContain("Run a sample review");
  });

  it("caps recommended topics at three and splits Do this now (TB-1045)", () => {
    const topics = recommendedHelpSearchPanelTopics("/help/core-pilot", false);

    expect(topics).toHaveLength(HELP_SEARCH_PANEL_MAX_RECOMMENDED);
    expect(topics.map((topic) => topic.id)).toEqual([
      "create-first-review",
      "sample-review",
      "upload-evidence",
    ]);

    const { doThisNow, moreRecommended } = splitHelpSearchPanelDoThisNow(topics);

    expect(doThisNow?.id).toBe("create-first-review");
    expect(moreRecommended.map((topic) => topic.id)).toEqual(["sample-review", "upload-evidence"]);
  });

  it("never recommends a topic that navigates to the current page (TB-1044)", () => {
    const topics = recommendedHelpSearchPanelTopics("/integrations/cloud-connections", false);

    expect(topics.map((topic) => topic.id)).not.toContain("cloud-connections");

    for (const topic of topics) {
      expect(helpSearchPanelTopicTargetsCurrentPage(topic, "/integrations/cloud-connections")).toBe(false);
    }

    const gettingStarted = listHelpSearchPanelTopics(false).find((topic) => topic.id === "getting-started-help");

    expect(gettingStarted).toBeDefined();
    expect(helpSearchPanelTopicTargetsCurrentPage(gettingStarted!, "/help/getting-started")).toBe(true);
  });

  it("recommends cloud connection topics on integrations route", () => {
    expect(recommendedHelpSearchPanelTopicIds("/integrations/cloud-connections")).toEqual([
      "cloud-connections",
      "connect-azure",
      "azure-permissions",
      "connect-aws",
      "connect-gcp",
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
    expect(architectTopics.map((topic) => topic.id)).not.toContain("cli-usage");
  });

  it("exposes admin diagnostics topics for admin callers", () => {
    const adminTopics = listHelpSearchPanelTopics(true);

    expect(adminTopics.map((topic) => topic.id)).toContain("admin-diagnostics");
    expect(adminTopics.map((topic) => topic.id)).toContain("advanced-diagnostics");
    expect(adminTopics.map((topic) => topic.id)).toContain("cli-usage");
  });

  it("keeps default architect-facing topics free of banned public copy", () => {
    for (const topic of listHelpSearchPanelTopics(false)) {
      expect(helpSearchPanelTopicHasBannedPublicCopy(topic), topic.id).toBe(false);
    }
  });

  it("routes first-review-guide search to the first-hour operator path", () => {
    const topics = listHelpSearchPanelTopics(false);
    const firstReview = topics.find((topic) => topic.id === "first-review-guide");

    expect(firstReview).toBeDefined();
    expect(firstReview?.action).toEqual({
      kind: "route",
      href: "/help/first-hour-operator-path",
      helpSlug: "first-hour-operator-path",
    });
  });

  it("exposes a distinct review-guide search entry for the wizard reference page", () => {
    const topics = listHelpSearchPanelTopics(false);
    const reviewGuide = topics.find((topic) => topic.id === "review-guide");

    expect(reviewGuide).toBeDefined();
    expect(reviewGuide?.title).toBe("Review guide");
    expect(reviewGuide?.action).toEqual({
      kind: "route",
      href: "/help/review-guide",
      helpSlug: "review-guide",
    });
  });
});
