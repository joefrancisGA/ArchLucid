import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { OperatorHomeContinueSetupCard } from "@/components/operator-home/OperatorHomeContinueSetupCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("PilotCommandCenterCard", () => {
  it("renders three intent cards without duplicate completed-sample CTA rows", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-create-architecture-cta")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-review-architecture-cta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();

    expect(screen.queryByTestId("pilot-command-center-open-completed-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-help")).toBeNull();
    expect(screen.queryByTestId("pilot-path-preview-stepper")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-cta-row")).toBeNull();
  });

  it("shows optional setup links on the readiness card instead of the hero (TB-346)", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();

    render(<OperatorHomeContinueSetupCard canBegin blockerMessage={null} />);

    expect(screen.getByRole("heading", { level: 3, name: PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("continue-setup-connect-cloud")).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.getByTestId("continue-setup-invite-reviewer")).toHaveAttribute("href", INVITE_REVIEWER_PATH);
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE }).className).toMatch(/border/);
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER }).className).toMatch(/border/);
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
