import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import {
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
  PILOT_COMMAND_CENTER_HEADING,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";

describe("PilotCommandCenterCard", () => {
  it("shows first-review hero copy before committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: PILOT_COMMAND_CENTER_HEADING }),
    ).toBeInTheDocument();
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<PilotCommandCenterCard />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("leads with design-first body copy and evidence-optional workflow steps", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-lead")).toHaveTextContent(PILOT_COMMAND_CENTER_LEAD);
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("design brief");
    expect(screen.getByTestId("pilot-command-center-lead").textContent?.toLowerCase()).toContain("optional azure");

    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();

    for (const step of PILOT_PATH_PREVIEW_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }

    expect(screen.queryByText("Open sample finding → Review evidence → See decision impact")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-outcomes")).toBeNull();
  });

  it("keeps Start review as the primary action in the header action row", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-primary")).toHaveTextContent("Start review");
    expect(screen.getByTestId("pilot-command-center-try-sample")).toHaveTextContent("Try sample review");
    expect(screen.getByTestId("pilot-command-center-cta-row")).toBeInTheDocument();
  });

  it("places workflow steps below the header row and optional setup as a muted footer", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<PilotCommandCenterCard />);

    const card = screen.getByTestId("pilot-command-center-card");
    const header = card.querySelector(".heroHeader");
    const stepper = screen.getByTestId("pilot-path-preview-stepper");
    const optionalSetup = screen.getByTestId("pilot-command-center-optional-setup");

    expect(header).not.toBeNull();
    expect(card.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.compareDocumentPosition(optionalSetup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(optionalSetup).toHaveClass("heroOptionalSetup");
    expect(optionalSetup.textContent).toContain("Optional setup:");
    expect(optionalSetup.textContent).toContain("Connect Azure");
    expect(optionalSetup.textContent).toContain("Invite reviewer");
  });
});
