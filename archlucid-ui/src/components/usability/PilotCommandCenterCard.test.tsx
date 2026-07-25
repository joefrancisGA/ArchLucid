import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
} from "@/lib/buyer-polish-copy";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import { PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT } from "@/lib/core-pilot-commit-context";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useNavCallerAuthorityRank: vi.fn(() => 100),
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({
    phase: "ready",
    context: {
      healthReady: true,
      healthLoadFailed: false,
      principalAdmin: true,
    },
    readyCount: 4,
    totalCount: 4,
  }),
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: false,
    hasActionNeededReviews: false,
    openFindingsCount: 0,
    recentRunIds: [],
    reportWorkspaceReviews: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      selectedRunId: "claims-intake-modernization",
      isConfigured: true,
      isAvailable: true,
      reviewTitle: "Claims intake modernization",
      architectureName: "Claims intake modernization",
      completedUtc: "2026-01-01T00:00:00.000Z",
      isSampleApproved: true,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
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

const emptyCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("PilotCommandCenterCard", () => {
  beforeEach(() => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(emptyCommitContext);
  });

  it("shows three intent paths before committed workspace activity", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-tagline")).toHaveTextContent(
      OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
    );
    expect(screen.getByTestId("pilot-command-center-tagline")).not.toHaveTextContent(/Both paths/i);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_INTENT_CHOOSER_HEADING }),
    ).toBeInTheDocument();

    const title = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_INTENT_CHOOSER_HEADING });
    expect(title.className).toContain("text-[15px]");
    expect(title.className).not.toContain("text-lg");

    for (const token of OPERATOR_HOME_CARD_SECTION_HEADING.split(/\s+/)) {
      if (token.length > 0) {
        expect(title.className).toContain(token);
      }
    }

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-explore-recommended-badge")).toHaveTextContent(
      OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
    );
    expect(screen.getByTestId("operator-home-explore-completed-review-cta")).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(screen.getByTestId("operator-home-create-architecture-cta")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-review-architecture-cta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toBeInTheDocument();
    expect(screen.queryByTestId("inline-guidance-recommended-next")).toBeNull();
    expect(screen.queryByText(/Recommended first/i)).toBeNull();
    expect(screen.queryByText(/Recommended next/i)).toBeNull();
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("uses dynamic next-best-action copy from Core Pilot commit context after first commit", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(
      <PilotCommandCenterCard openFindingsCount={2} hasWorkspaceReviews />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent("Review open findings");
    expect(screen.getByTestId("pilot-command-center-lead")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-dual-path-cards")).toBeNull();
  });

  it("does not lead with Review open findings when committed signal is set but workspace is empty", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      ...PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
    });

    renderWithOperatorQuery(
      <PilotCommandCenterCard openFindingsCount={0} hasWorkspaceReviews={false} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pilot-next-best-action")).not.toHaveTextContent("Review open findings");
    expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent(OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA);
  });

  it("does not render optional setup links on the hero card", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();
  });
});
