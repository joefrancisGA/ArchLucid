import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "./PilotCommandCenterCard";
import { RunsListCompareSelectionBar } from "./RunsListCompareSelectionBar";
import { proofScopeToRequiredCapabilities } from "./QuickReviewProofScopeField";

describe("PilotCommandCenterCard", () => {
  it("renders primary start review CTA, outcomes, path preview, and example review CTA", () => {
    render(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-primary")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("pilot-command-center-example")).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByTestId("pilot-command-center-help")).toHaveAttribute("href", "/help/core-pilot");
    expect(screen.getByTestId("pilot-path-preview-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-outcomes")).toBeInTheDocument();
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
