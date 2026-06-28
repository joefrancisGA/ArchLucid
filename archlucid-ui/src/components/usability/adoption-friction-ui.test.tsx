import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";
import {
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
} from "@/lib/buyer-polish-copy";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

describe("PilotCommandCenterCard", () => {
  it("renders primary start review CTA, design-first lead, and path preview without a duplicate sample link", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-next-best-action")).toHaveAttribute("href", "/reviews/new");
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-help")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-lead")).toHaveTextContent(
      "Each architecture review is tracked as one review package from capture through signed review record and export.",
    );
    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-outcomes")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-cta-row")).toBeInTheDocument();
  });

  it("shows optional setup links inline instead of a Setup disclosure (TB-346)", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-optional-setup")).toBeInTheDocument();
    expect(screen.getByText(PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-connect-azure")).toHaveAttribute("href", "/integrations/cloud-connections");
    expect(screen.getByTestId("pilot-command-center-invite-reviewer")).toHaveAttribute("href", INVITE_REVIEWER_PATH);
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_CONNECT_AZURE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: PILOT_COMMAND_CENTER_INVITE_REVIEWER })).toBeInTheDocument();
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
