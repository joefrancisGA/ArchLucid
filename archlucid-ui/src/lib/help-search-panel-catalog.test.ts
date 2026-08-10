import { describe, expect, it } from "vitest";

import {
  filterHelpSearchPanelTopics,
  HELP_SEARCH_PANEL_MAX_RECOMMENDED,
  HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL,
  helpSearchPanelTopicHasBannedPublicCopy,
  helpSearchPanelTopicTargetsCurrentPage,
  listDuplicateHelpSearchPanelTopicTitles,
  listHelpSearchPanelGroups,
  listHelpSearchPanelTopics,
  recommendedHelpSearchPanelTopicIds,
  recommendedHelpSearchPanelTopics,
  shouldCollapseHelpStartHereGroup,
  splitHelpSearchPanelDoThisNow,
} from "@/lib/help-search-panel-catalog";

describe("help-search-panel-catalog", () => {
  it("uses slash-canonical cloud connection help hrefs (TB-748)", () => {
    const topics = listHelpSearchPanelTopics();

    expect(topics.find((topic) => topic.id === "connect-azure")?.action.href).toBe(
      "/help/cloud-connections/azure",
    );
    expect(topics.find((topic) => topic.id === "connect-aws")?.action.href).toBe("/help/cloud-connections/aws");
    expect(topics.find((topic) => topic.id === "connect-gcp")?.action.href).toBe("/help/cloud-connections/gcp");
  });

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
    expect(recommendedHelpSearchPanelTopicIds("/help/first-architecture-review")).toEqual([
      "create-first-review",
      "sample-review",
      "upload-evidence",
      "cloud-connections",
      "troubleshoot",
    ]);

    const titles = recommendedHelpSearchPanelTopics("/help/first-architecture-review", false).map((topic) => topic.title);

    expect(titles).not.toContain("Getting started");
    expect(titles).not.toContain("How ArchLucid works");
    expect(titles).not.toContain("First review guide");
    expect(titles).toContain("Create your first review");
    expect(titles).toContain("Run a sample review");
  });

  it("caps recommended topics at three and splits Do this now (TB-1045)", () => {
    const topics = recommendedHelpSearchPanelTopics("/help/first-architecture-review", false);

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

  it("routes first-review-guide search to Your first architecture review", () => {
    const topics = listHelpSearchPanelTopics(false);
    const firstReview = topics.find((topic) => topic.id === "first-review-guide");

    expect(firstReview).toBeDefined();
    expect(firstReview?.title).toBe("Your first architecture review");
    expect(firstReview?.action).toEqual({
      kind: "route",
      href: "/help/first-architecture-review",
      helpSlug: "first-architecture-review",
    });
  });

  it("exposes a distinct review-guide search entry for the wizard reference page", () => {
    const topics = listHelpSearchPanelTopics(false);
    const reviewGuide = topics.find((topic) => topic.id === "review-guide");

    expect(reviewGuide).toBeDefined();
    expect(reviewGuide?.title).toBe("Review wizard reference");
    expect(reviewGuide?.action).toEqual({
      kind: "route",
      href: "/help/review-guide",
      helpSlug: "review-guide",
    });
  });

  it("keeps Help drawer topic titles unique after disambiguation (TB-1047)", () => {
    expect(listDuplicateHelpSearchPanelTopicTitles(false)).toEqual([]);
    expect(listDuplicateHelpSearchPanelTopicTitles(true)).toEqual([]);
  });

  it("lets a published situation outrank path-prefix recommendations", () => {
    expect(recommendedHelpSearchPanelTopicIds("/architecture/reviews/run-1", "review-approval-blocked")).toEqual([
      "resolve-blocking-findings",
      "governance-workflow",
      "review-artifacts",
    ]);

    const topics = recommendedHelpSearchPanelTopics(
      "/architecture/reviews/run-1",
      false,
      "review-approval-blocked",
    );
    const { doThisNow } = splitHelpSearchPanelDoThisNow(topics);

    expect(doThisNow?.title).toBe("Resolve findings that block approval");
  });

  it("falls back to path recommendations when no situation is published", () => {
    expect(recommendedHelpSearchPanelTopicIds("/architecture/reviews/run-1", null)).toEqual([
      "review-findings",
      "finalize-review",
      "review-artifacts",
    ]);
  });

  it("resolves situation-only topics that are absent from the browse groups", () => {
    const situationTopicIds = ["resolve-blocking-findings", "close-evidence-gaps"];
    const groupedIds = listHelpSearchPanelGroups(true).flatMap((group) => group.topics.map((topic) => topic.id));
    const allIds = listHelpSearchPanelTopics(true).map((topic) => topic.id);

    for (const id of situationTopicIds) {
      expect(allIds, id).toContain(id);
      expect(groupedIds, id).not.toContain(id);
    }
  });

  it("collapses onboarding topics on product surfaces but not in the funnel or Help Center", () => {
    expect(shouldCollapseHelpStartHereGroup("/architecture/reviews/run-1")).toBe(true);
    expect(shouldCollapseHelpStartHereGroup("/governance/findings")).toBe(true);
    expect(shouldCollapseHelpStartHereGroup("/")).toBe(false);
    expect(shouldCollapseHelpStartHereGroup("/help")).toBe(false);
    expect(shouldCollapseHelpStartHereGroup("/help/getting-started")).toBe(false);
    expect(shouldCollapseHelpStartHereGroup("/pricing")).toBe(false);
    expect(shouldCollapseHelpStartHereGroup("/auth/signin")).toBe(false);
  });

  it("names the support footer action after the destination it opens", () => {
    const supportTopic = listHelpSearchPanelTopics(false).find((topic) => topic.id === "contact-support");

    expect(HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL).toBe("Support and troubleshooting");
    expect(supportTopic?.title).toBe(HELP_SEARCH_PANEL_SUPPORT_FOOTER_LABEL);
  });

  it("exposes a report-a-problem topic for defect intake", () => {
    const reportTopic = listHelpSearchPanelTopics(false).find((topic) => topic.id === "report-a-problem");

    expect(reportTopic?.action).toEqual({
      kind: "route",
      href: "/help/report-a-problem",
      helpSlug: "report-a-problem",
    });
  });
});
