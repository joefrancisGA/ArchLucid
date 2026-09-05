import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import {
  buildGovernanceFindingsQueueHref,
  buildReviewDetailFindingsTabHref,
  reviewFindingsGovernanceQueuePresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

import {
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE,
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING,
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO,
  buildReviewPackageGovernanceFindingsVocabulary,
  resolveReviewPackageGovernanceFindingsPeerLink,
} from "@/lib/vocabulary/review-package-governance-findings-vocabulary";

describe("review-package-governance-findings-vocabulary (TB-2386)", () => {
  it("names this review vs workspace risk register and deep-links both surfaces", () => {
    const model = buildReviewPackageGovernanceFindingsVocabulary("run-abc");

    expect(model.heading).toBe(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING);
    expect(model.whyTwo).toBe(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("this review");
    expect(model.whyTwo.toLowerCase()).toContain("workspace");
    expect(model.whyTwo.toLowerCase()).toContain("risk register");
    expect(model.compactLine).toBe(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE);

    expect(model.reviewPackageFindingsLink.href).toBe(buildReviewDetailFindingsTabHref("run-abc"));
    expect(model.reviewPackageFindingsLink.label.toLowerCase()).toContain("this review");

    expect(model.governanceFindingsLink.href).toBe(
      buildGovernanceFindingsQueueHref({ runId: "run-abc", filter: "all" }),
    );
    expect(model.governanceFindingsLink.label.toLowerCase()).toContain("workspace");
  });

  it("uses Reviews hub peer when no runId is in scope", () => {
    const model = buildReviewPackageGovernanceFindingsVocabulary();

    expect(model.reviewPackageFindingsLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.governanceFindingsLink.href).toBe(
      buildGovernanceFindingsQueueHref({ filter: "open" }),
    );
    expect(model.governanceFindingsLink.href).toBe(`${GOVERNANCE_FINDINGS_PATH}?filter=open`);
  });

  it("resolves peer deep links from each surface", () => {
    const scopedModel = buildReviewPackageGovernanceFindingsVocabulary("run-1");

    expect(
      resolveReviewPackageGovernanceFindingsPeerLink("review-package-findings", scopedModel),
    ).toEqual(scopedModel.governanceFindingsLink);
    expect(
      resolveReviewPackageGovernanceFindingsPeerLink("governance-findings-queue", scopedModel),
    ).toEqual(scopedModel.reviewPackageFindingsLink);
  });

  it("pairs metric-count nouns with rail labels for home drill-down", () => {
    const reviewMetric = reviewFindingsGovernanceQueuePresentation("run-1", 3);
    const workspaceMetric = workspaceOpenFindingsPresentation(5);
    const model = buildReviewPackageGovernanceFindingsVocabulary("run-1");

    expect(reviewMetric.dimensions.some((dimension) => dimension.kind === "this-review")).toBe(
      true,
    );
    expect(workspaceMetric.dimensions).toHaveLength(0);
    expect(model.reviewPackageFindingsLink.label.toLowerCase()).toContain("this review");
    expect(model.governanceFindingsLink.label.toLowerCase()).toContain("workspace");
    expect(model.governanceFindingsLink.href).toBe(reviewMetric.href);
    expect(buildReviewPackageGovernanceFindingsVocabulary().governanceFindingsLink.href).toBe(
      workspaceMetric.href,
    );
  });
});
