import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tabs } from "@/components/ui/tabs";
import { GraphPageControls } from "@/app/(operator)/insights/evidence-graph/_sections/GraphPageControls";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker-stub" />,
}));

describe("GraphPageControls buyer presentation tabs (TB-669)", () => {
  it("hides load button when workspace has no completed reviews", () => {
    render(
      <GraphPageControls
        graphMainColumnMaxClass="max-w-3xl"
        runId=""
        onRunIdChange={() => undefined}
        mode="provenance-full"
        onModeChange={() => undefined}
        demoUi
        buyerPolishedShell
        showLoadButton={false}
        loadButtonLabel="Load evidence graph"
        loading={false}
        onLoadGraph={() => undefined}
        decisionId=""
        nodeId=""
        reviewPickerState="no-packages"
        sampleGraphActive={false}
        showPresentationTabs={false}
        compactEmptyWorkspace
      />,
    );

    expect(screen.queryByRole("button", { name: "Load evidence graph" })).toBeNull();
    expect(screen.getByTestId("graph-page-controls-buyer")).toBeInTheDocument();
  });

  it("renders tablist with aria-selected and keyboard navigation", () => {
    const onPresentationViewChange = vi.fn();

    render(
      <Tabs value="graph" onValueChange={onPresentationViewChange}>
        <GraphPageControls
          graphMainColumnMaxClass="max-w-3xl"
          runId="demo-run"
          onRunIdChange={() => undefined}
          mode="provenance-full"
          onModeChange={() => undefined}
          demoUi
          buyerPolishedShell
          showLoadButton={false}
          loadButtonLabel="Load evidence graph"
          loading={false}
          onLoadGraph={() => undefined}
          decisionId=""
          nodeId=""
          reviewPickerState="real-review"
          sampleGraphActive={false}
          showPresentationTabs
        />
      </Tabs>,
    );

    expect(screen.getByRole("tablist", { name: "Evidence graph view" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Graph view" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Trace table" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("button", { name: "Graph view" })).toBeNull();

    const graphTab = screen.getByRole("tab", { name: "Graph view" });
    graphTab.focus();
    fireEvent.keyDown(screen.getByRole("tablist", { name: "Evidence graph view" }), { key: "ArrowRight" });

    expect(onPresentationViewChange).toHaveBeenCalledWith("trace");
  });

  it("suppresses sample-review picker status when the sample banner owns the claim (TB-2100)", () => {
    render(
      <GraphPageControls
        graphMainColumnMaxClass="max-w-3xl"
        runId="customer-intake-modernization"
        onRunIdChange={() => undefined}
        mode="provenance-full"
        onModeChange={() => undefined}
        demoUi
        buyerPolishedShell
        showLoadButton={false}
        loadButtonLabel="Load evidence graph"
        loading={false}
        onLoadGraph={() => undefined}
        decisionId=""
        nodeId=""
        reviewPickerState="sample-review"
        sampleGraphActive
        showPresentationTabs={false}
      />,
    );

    expect(screen.queryByTestId("graph-review-picker-status")).toBeNull();
  });

  it("still renders picker error and no-packages-adjacent states when sample banner is inactive", () => {
    const { unmount } = render(
      <GraphPageControls
        graphMainColumnMaxClass="max-w-3xl"
        runId=""
        onRunIdChange={() => undefined}
        mode="provenance-full"
        onModeChange={() => undefined}
        demoUi
        buyerPolishedShell
        showLoadButton={false}
        loadButtonLabel="Load evidence graph"
        loading={false}
        onLoadGraph={() => undefined}
        decisionId=""
        nodeId=""
        reviewPickerState="no-selection"
        sampleGraphActive={false}
        showPresentationTabs={false}
      />,
    );

    expect(screen.getByTestId("graph-review-picker-status")).toHaveAttribute("data-picker-state", "no-selection");
    unmount();
  });
});
