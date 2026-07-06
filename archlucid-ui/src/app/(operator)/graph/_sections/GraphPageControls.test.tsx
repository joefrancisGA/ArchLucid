import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tabs } from "@/components/ui/tabs";
import { GraphPageControls } from "@/app/(operator)/graph/_sections/GraphPageControls";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker-stub" />,
}));

describe("GraphPageControls buyer presentation tabs (TB-669)", () => {
  it("renders tablist with aria-selected and keyboard navigation", () => {
    const onPresentationViewChange = vi.fn();

    render(
      <Tabs value="trace" onValueChange={onPresentationViewChange}>
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
        />
      </Tabs>,
    );

    expect(screen.getByRole("tablist", { name: "Evidence graph view" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Trace table" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Graph view" })).toHaveAttribute("aria-selected", "false");
    expect(screen.queryByRole("button", { name: "Trace table" })).toBeNull();

    const traceTab = screen.getByRole("tab", { name: "Trace table" });
    traceTab.focus();
    fireEvent.keyDown(screen.getByRole("tablist", { name: "Evidence graph view" }), { key: "ArrowRight" });

    expect(onPresentationViewChange).toHaveBeenCalledWith("graph");
  });
});
