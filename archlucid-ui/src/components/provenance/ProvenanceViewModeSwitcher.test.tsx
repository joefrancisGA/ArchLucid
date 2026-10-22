import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ProvenanceViewModeSwitcher,
  provenanceViewModeTestId,
  provenanceViewPanelProps,
  type ProvenanceViewMode,
  type ProvenanceViewModeOption,
} from "./ProvenanceViewModeSwitcher";

const OPTIONS: readonly ProvenanceViewModeOption[] = [
  { id: "graph", label: "Graph" },
  { id: "timeline", label: "Timeline" },
  { id: "table", label: "Tables" },
];

function renderSwitcher(viewMode: ProvenanceViewMode, onViewModeChange = vi.fn()) {
  render(
    <ProvenanceViewModeSwitcher
      options={OPTIONS}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />,
  );

  return onViewModeChange;
}

describe("ProvenanceViewModeSwitcher (TB-1664 / TB-1665)", () => {
  it("renders a segmented group instead of fake tab roles", () => {
    renderSwitcher("graph");

    expect(screen.getByRole("group", { name: "Provenance view" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("marks only the active mode as pressed", () => {
    renderSwitcher("timeline");

    expect(screen.getByTestId(provenanceViewModeTestId("timeline"))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId(provenanceViewModeTestId("graph"))).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId(provenanceViewModeTestId("table"))).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the typed mode when a segment is activated", () => {
    const onViewModeChange = renderSwitcher("graph");

    fireEvent.click(screen.getByTestId(provenanceViewModeTestId("table")));

    expect(onViewModeChange).toHaveBeenCalledWith("table");
  });

  it("labels view panels as regions rather than tabpanels", () => {
    expect(provenanceViewPanelProps("graph", true)).toEqual({
      id: "prov-graph",
      role: "region",
      "aria-labelledby": "prov-graph-heading",
      hidden: undefined,
    });
  });

  it("hides inactive panels", () => {
    expect(provenanceViewPanelProps("table", false).hidden).toBe(true);
  });
});
