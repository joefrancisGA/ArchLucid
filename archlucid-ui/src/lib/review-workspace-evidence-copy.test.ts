import { describe, expect, it } from "vitest";

import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  REVIEW_WORKSPACE_HELP_TOPIC,
  REVIEW_WORKSPACE_HELP_TOPIC_LABEL,
  pathIsReviewWorkspaceDetail,
} from "@/lib/review-workspace-evidence-copy";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { REVIEW_PACKAGES_HELP_PAGE_TITLE } from "@/lib/review-packages-help-page-copy";

describe("review-workspace-evidence-copy", () => {
  it("detects review workspace detail routes but not hub or child surfaces", () => {
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/run-abc")).toBe(true);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/run-abc/print")).toBe(true);
    expect(pathIsReviewWorkspaceDetail("/reviews/run-abc")).toBe(true);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews")).toBe(false);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/new")).toBe(false);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/run-abc/findings/finding-1")).toBe(false);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/run-abc/provenance")).toBe(false);
    expect(pathIsReviewWorkspaceDetail("/architecture/reviews/run-abc/artifacts/cost-summary")).toBe(false);
  });

  it("maps review workspace detail to Review workspace help (not Architecture packages hub)", () => {
    const topic = pageHelpTopicForPathname("/architecture/reviews/run-abc");

    expect(topic).toEqual(REVIEW_WORKSPACE_HELP_TOPIC);
    expect(topic?.label).toBe(REVIEW_WORKSPACE_HELP_TOPIC_LABEL);
    expect(topic?.label).not.toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);
    expect(inAppHelpHref(topic?.slug ?? "", topic?.hashFragment)).toBe(
      "/help/review-packages#inspect-an-architecture-package",
    );
  });

  it("keeps the reviews hub on Architecture packages help", () => {
    const hubTopic = pageHelpTopicForPathname("/architecture/reviews");

    expect(hubTopic?.slug).toBe("review-packages");
    expect(hubTopic?.label).toBe(REVIEW_PACKAGES_HELP_PAGE_TITLE);
  });

  it("resolves Category-1 contextual help for review workspace detail", () => {
    const entry = contextualHelpForPathname("/architecture/reviews/run-abc");

    expect(entry?.whatIsThisPage).toContain("Review workspace");
    expect(entry?.whatToDoNext).toContain("Findings tab");
  });
});
