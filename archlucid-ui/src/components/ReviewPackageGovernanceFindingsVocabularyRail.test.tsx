import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageGovernanceFindingsVocabularyRail } from "@/components/ReviewPackageGovernanceFindingsVocabularyRail";
import {
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE,
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING,
  REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO,
  buildReviewPackageGovernanceFindingsVocabulary,
} from "@/lib/vocabulary/review-package-governance-findings-vocabulary";

describe("ReviewPackageGovernanceFindingsVocabularyRail (TB-2386)", () => {
  it("renders compact strip on review findings with peer link to workspace queue", () => {
    const model = buildReviewPackageGovernanceFindingsVocabulary("run-abc");

    render(
      <ReviewPackageGovernanceFindingsVocabularyRail
        runId="run-abc"
        currentSurfaceId="review-package-findings"
        model={model}
      />,
    );

    const strip = screen.getByTestId("review-package-governance-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "review-package-findings");
    expect(strip.textContent ?? "").toContain(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE);

    const peer = screen.getByTestId("review-package-governance-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.governanceFindingsLink.label);
    expect(peer).toHaveAttribute("href", model.governanceFindingsLink.href);
  });

  it("renders compact strip on governance queue with peer link to this review", () => {
    const model = buildReviewPackageGovernanceFindingsVocabulary("run-abc");

    render(
      <ReviewPackageGovernanceFindingsVocabularyRail
        runId="run-abc"
        currentSurfaceId="governance-findings-queue"
        model={model}
      />,
    );

    expect(screen.getByTestId("review-package-governance-findings-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "governance-findings-queue",
    );

    const peer = screen.getByTestId("review-package-governance-findings-vocabulary-peer-link");
    expect(peer).toHaveTextContent(model.reviewPackageFindingsLink.label);
    expect(peer).toHaveAttribute("href", model.reviewPackageFindingsLink.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <ReviewPackageGovernanceFindingsVocabularyRail
        runId="run-abc"
        currentSurfaceId="review-package-findings"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("review-package-governance-findings-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("review-package-governance-findings-vocabulary-current")).toHaveTextContent(
      "This review's findings",
    );
  });
});
