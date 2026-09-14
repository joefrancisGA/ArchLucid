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

    expect(sortButton).toHaveTextContent("Resource");
    expect(sortButton).toHaveTextContent("↑");
    expect(screen.getByTestId("infra-drift-resource-filter-trigger")).toBeInTheDocument();

    fireEvent.click(sortButton);

    expect(onSort).toHaveBeenCalledTimes(1);
  });
});
