import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";

describe("PilotCommandCenterCard", () => {
  it("renders primary start review CTA, outcomes, path preview, and sample-data link", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-primary")).toHaveAttribute("href", "/reviews/new");
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-try-sample")).toHaveAttribute(
      "href",
      "/reviews/new?zeroConfig=1",
    );
    expect(screen.queryByTestId("pilot-command-center-help")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-first-run-steps")).toHaveTextContent(
      "Open sample finding → Review evidence → See decision impact",
    );
    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-outcomes")).toBeInTheDocument();
    expect(screen.getByText("Evidence gaps")).toBeInTheDocument();
    expect(screen.getByText("Decision impact")).toBeInTheDocument();
    expect(screen.getByText("Optional setup:")).toBeInTheDocument();
  });

  it("exposes optional setup links inline without a disclosure", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-setup-disclosure")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-connect-azure")).toHaveAttribute("href", "/settings/cloud-connections");
    expect(screen.getByTestId("pilot-command-center-invite-reviewer")).toHaveAttribute("href", "/settings/roles");
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
