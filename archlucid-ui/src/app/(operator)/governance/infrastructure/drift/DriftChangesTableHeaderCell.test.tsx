import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftChangesTableHeaderCell } from "./DriftChangesTableHeaderCell";

describe("DriftChangesTableHeaderCell", () => {
  it("renders a sort button with direction indicator and filter trigger", () => {
    const onSort = vi.fn();

    render(
      <table>
        <thead>
          <tr>
            <DriftChangesTableHeaderCell
              column="resource"
              label="Resource"
              sortBy="resource"
              sortDir="asc"
              sortDirection="ascending"
              onSort={onSort}
              filter={{
                kind: "text",
                value: "gateway",
                filterTestId: "infra-drift-resource-filter",
                onApply: vi.fn(),
                onClear: vi.fn(),
              }}
            />
          </tr>
        </thead>
      </table>,
    );

    const sortButton = screen.getByTestId("infra-drift-sort-resource");
    const cluster = screen.getByTestId("infra-drift-header-cluster-resource");
    const filterTrigger = screen.getByTestId("infra-drift-resource-filter-trigger");

    expect(sortButton).toHaveTextContent("Resource");
    expect(sortButton).toHaveTextContent("↑");
    expect(sortButton.className).not.toMatch(/\bflex-1\b/);
    expect(cluster).toHaveClass("inline-flex");
    expect(cluster).toContainElement(sortButton);
    expect(cluster).toContainElement(filterTrigger);

    fireEvent.click(sortButton);

    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("preserves unapplied filter text during an unrelated rerender", () => {
    const onApply = vi.fn();
    const renderHeader = (value: string, sortDir: "asc" | "desc") => (
      <table>
        <thead>
          <tr>
            <DriftChangesTableHeaderCell
              column="resource"
              label="Resource"
              sortBy="resource"
              sortDir={sortDir}
              sortDirection={sortDir === "asc" ? "ascending" : "descending"}
              onSort={vi.fn()}
              filter={{
                kind: "text",
                value,
                filterTestId: "infra-drift-resource-filter",
                onApply,
                onClear: vi.fn(),
              }}
            />
          </tr>
        </thead>
      </table>
    );

    const { rerender } = render(renderHeader("gateway", "asc"));
    fireEvent.click(screen.getByTestId("infra-drift-resource-filter-trigger"));
    const input = screen.getByTestId("infra-drift-resource-filter");
    fireEvent.change(input, { target: { value: "gateway-west" } });

    rerender(renderHeader("gateway", "desc"));
    expect(input).toHaveValue("gateway-west");

    rerender(renderHeader("worker", "desc"));
    expect(input).toHaveValue("worker");

    fireEvent.change(input, { target: { value: "worker-east" } });
    fireEvent.click(screen.getByTestId("infra-drift-resource-filter-apply"));
    expect(onApply).toHaveBeenCalledWith("worker-east");
  });
});
