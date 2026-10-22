import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DRIFT_TABLE_FILTER_STATE } from "@/lib/infra-evidence/infra-evidence-drift-table-filter";

import { DriftChangesTableHead } from "./DriftChangesTableHead";

describe("DriftChangesTableHead", () => {
  it("puts change, property, and risk filters on the diff list", () => {
    render(
      <table>
        <DriftChangesTableHead
          tableFilterState={DEFAULT_DRIFT_TABLE_FILTER_STATE}
          hasActiveFilters={false}
          onSortColumn={vi.fn()}
          onTableFiltersChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      </table>,
    );

    expect(screen.getByTestId("infra-drift-change-type-filter-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-property-filter-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-risk-filter-trigger")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter Change")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter Property")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter Risk")).toBeInTheDocument();
  });
});
