import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftSnapshotsTable } from "@/app/(operator)/governance/infrastructure/drift/DriftSnapshotsTable";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE } from "@/lib/infra-evidence/infra-evidence-drift-snapshots-table-filter";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "sub-1",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-01T12:00:00Z",
    captureStatus: 1,
    resourceCount: 42,
    relationshipCount: 10,
    ...overrides,
  };
}

const tableProps = {
  loading: false,
  tableFilterState: DEFAULT_DRIFT_SNAPSHOTS_TABLE_FILTER_STATE,
  hasActiveFilters: false,
  onSelectSnapshot: vi.fn(),
  onFocusSnapshot: vi.fn(),
  onSortColumn: vi.fn(),
  onTableFiltersChange: vi.fn(),
  onClearFilters: vi.fn(),
};

describe("DriftSnapshotsTable", () => {
  it("renders snapshot rows, capture status tags, and marks the selected snapshot", () => {
    render(
      <DriftSnapshotsTable
        snapshots={[
          snapshot(),
          snapshot({
            snapshotId: "22222222-2222-2222-2222-222222222222",
            subscriptionName: "Dev",
            captureStatus: 2,
          }),
        ]}
        selectedSnapshotId="11111111-1111-1111-1111-111111111111"
        focusedSnapshotId="11111111-1111-1111-1111-111111111111"
        {...tableProps}
      />,
    );

    expect(screen.getByRole("table", { name: "Inventory snapshots" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-snapshot-capture-status-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "Ready",
    );
    expect(screen.getByTestId("infra-drift-snapshot-capture-status-22222222-2222-2222-2222-222222222222")).toHaveTextContent(
      "Needs attention",
    );
    expect(screen.getByTestId("infra-drift-snapshot-row-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("infra-drift-snapshot-selected-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-snapshot-captured-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "dateTime",
      "2026-09-01T12:00:00.000Z",
    );
    expect(screen.getByText("Dev")).toBeInTheDocument();
  });

  it("renders blocked capture status", () => {
    render(
      <DriftSnapshotsTable
        snapshots={[snapshot({ captureStatus: 3 })]}
        selectedSnapshotId=""
        focusedSnapshotId=""
        {...tableProps}
      />,
    );

    expect(screen.getByTestId("infra-drift-snapshot-capture-status-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "Blocked",
    );
  });

  it("calls onSelectSnapshot when a row is clicked and exposes select/delete actions", () => {
    const onSelectSnapshot = vi.fn();
    const onDeleteSnapshot = vi.fn();

    render(
      <DriftSnapshotsTable
        snapshots={[snapshot()]}
        selectedSnapshotId=""
        focusedSnapshotId=""
        {...tableProps}
        onSelectSnapshot={onSelectSnapshot}
        onDeleteSnapshot={onDeleteSnapshot}
      />,
    );

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-row-11111111-1111-1111-1111-111111111111"));
    expect(onSelectSnapshot).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-select-11111111-1111-1111-1111-111111111111"));
    expect(onSelectSnapshot).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Delete inventory snapshot for Prod" }),
    ).toBeInTheDocument();
  });
});
