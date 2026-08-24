import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";
import {
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useNavCallerAuthorityRank: () => 100,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),}));

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
      selectedRunId: "customer-intake-modernization",
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
  usePathname: () => "/",
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    isPending: false,
    activeStageId: null,
    showStagedPanel: false,
    stages: [],
    loadingLabel: "Starting review…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    loadingLabel: "Starting architecture…",
    error: null,
  }),
}));

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewVisible: () => true,
}));

describe("PilotCommandCenterCard", () => {
  it("renders create and review lifecycle cards on empty Overview (ADR 0067)", async () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-create-architecture-cta")).toHaveTextContent(
      CREATE_ARCHITECTURE_LABEL,
    );
    expect(screen.getByTestId("operator-home-review-architecture-cta")).toHaveTextContent(
      OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
    );
    expect(screen.queryByTestId("operator-home-do-this-next")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-help")).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-open-completed-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-path-preview-stepper")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-cta-row")).toBeNull();
  });

  it("keeps optional invite setup off the empty-home hero while lifecycle cards expose cloud connect (TB-346)", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();
    expect(screen.getByTestId("operator-home-connect-cloud-path")).toBeInTheDocument();

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
