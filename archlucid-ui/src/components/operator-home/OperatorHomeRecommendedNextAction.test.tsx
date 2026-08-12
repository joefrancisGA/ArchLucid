import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeRecommendedNextAction } from "@/components/operator-home/OperatorHomeRecommendedNextAction";
import {
  OPERATOR_HOME_RECOMMENDED_NEXT_LABEL,
  OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE,
} from "@/lib/buyer/buyer-polish-copy";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");
  const mockModule = await createCorePilotCommitContextModuleMock(importOriginal);
  const fetchCorePilotCommitContext = vi.mocked(mockModule.fetchCorePilotCommitContext);

  fetchCorePilotCommitContext.mockResolvedValue({
    hasCommittedManifest: false,
    committedReviewCount: 0,
    latestRunId: null,
    firstCommittedRunId: null,
    secondCommittedRunId: null,
    latestRunReadyToFinalize: false,
  });

  return mockModule;
});

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";

describe("OperatorHomeRecommendedNextAction", () => {
  beforeEach(() => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
      latestRunReadyToFinalize: false,
    });
  });

  it("renders compact recommended-next guidance for first-run tenants", async () => {
    renderWithOperatorQuery(<OperatorHomeRecommendedNextAction />);

    expect(screen.getByTestId("operator-home-recommended-next-action")).toBeInTheDocument();
    expect(screen.getByTestId("inline-guidance-recommended-next")).toHaveTextContent(
      OPERATOR_HOME_RECOMMENDED_NEXT_LABEL,
    );
    expect(await screen.findByRole("link", { name: OPERATOR_HOME_RECOMMENDED_NEXT_OPEN_SAMPLE })).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
  });
});
