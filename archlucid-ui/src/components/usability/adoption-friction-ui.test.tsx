import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_INVITE_REVIEWER,
  PILOT_COMMAND_CENTER_OPTIONAL_SETUP_LABEL,
  PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK,
  PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY,
} from "@/lib/buyer-polish-copy";
import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

describe("PilotCommandCenterCard", () => {
  it("renders completed-sample primary CTA, first-hour lead, and path preview without a duplicate sample link", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-next-best-action")).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent(OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA);
    expect(screen.getByTestId("pilot-command-center-start-own-review")).toHaveAttribute("href", "/reviews/new");
    const startOwnReview = screen.getByRole("link", { name: PILOT_COMMAND_CENTER_START_OWN_REVIEW_LINK });
    expect(startOwnReview.className).toMatch(/border-neutral-300/);
    expect(startOwnReview.className).not.toMatch(/underline/);
    const openSample = screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA });
    expect(openSample.className).toMatch(/bg-\[var\(--al-primary-action-bg\)\]/);
    expect(openSample.className).not.toMatch(/border-neutral-300/);
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-help")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-lead")).toHaveTextContent(PILOT_FIRST_HOUR_NO_RUN_BRIDGE_COPY);
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
