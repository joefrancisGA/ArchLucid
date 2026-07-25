import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";
import {
  OPERATOR_HOME_DO_THIS_NEXT_HEADING,
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useNavCallerAuthorityRank: () => 100,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: false,
    hasActionNeededReviews: false,
    openFindingsCount: 0,
    recentRunIds: [],
    reportWorkspaceReviews: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("PilotCommandCenterCard", () => {
  it("renders a single Do-this-next primary CTA on empty Overview (TB-1038)", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("operator-home-do-this-next")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_DO_THIS_NEXT_HEADING })).toBeInTheDocument();
    expect(screen.getAllByTestId("operator-home-do-this-next-primary")).toHaveLength(1);
    expect(screen.getByTestId("operator-home-do-this-next-primary")).toHaveTextContent(
      OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-dual-path-cards")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-open-completed-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-help")).toBeNull();
    expect(screen.queryByTestId("pilot-path-preview-stepper")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-cta-row")).toBeNull();
  });

  it("keeps optional cloud / invite setup off the empty-home hero (TB-346 / TB-1038)", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();
    expect(screen.queryByTestId("operator-home-optional-cloud-shortcut")).toBeNull();

    render(<OperatorHomeContinueSetupCard canBegin blockerMessage={null} />);

    expect(screen.queryByRole("heading", { level: 3, name: PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL })).toBeNull();
    expect(screen.queryByTestId("continue-setup-connect-cloud")).toBeNull();
    expect(screen.queryByTestId("continue-setup-invite-reviewer")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-setup-disclosure")).toBeNull();
  });
});

describe("RunsListCompareSelectionBar", () => {
  it("enables compare when two packages are selected", () => {
    render(
      <RunsListCompareSelectionBar
        selectedRunIds={["run-a", "run-b"]}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByTestId("runs-list-compare-selected")).toHaveAttribute(
      "href",
      expect.stringContaining("run-a"),
    );
  });

  it("calls onClear when clear is clicked", () => {
    const onClear = vi.fn();

    render(<RunsListCompareSelectionBar selectedRunIds={["run-a"]} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("proofScopeToRequiredCapabilities", () => {
  it("maps selected proof dimensions to capability tags", () => {
    expect(proofScopeToRequiredCapabilities(["cost", "topology"])).toEqual([
      "cost-estimation",
      "architecture-topology",
    ]);
  });
});
