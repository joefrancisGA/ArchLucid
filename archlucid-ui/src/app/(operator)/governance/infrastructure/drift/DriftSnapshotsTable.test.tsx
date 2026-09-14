import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftSnapshotsTable } from "@/app/(operator)/governance/infrastructure/drift/DriftSnapshotsTable";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

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

describe("DriftSnapshotsTable", () => {
  it("renders snapshot rows and marks the selected snapshot", () => {
    const onSelectSnapshot = vi.fn();

    render(
      <DriftSnapshotsTable
        snapshots={[snapshot(), snapshot({ snapshotId: "22222222-2222-2222-2222-222222222222", subscriptionName: "Dev" })]}
        selectedSnapshotId="11111111-1111-1111-1111-111111111111"
        loading={false}
        onSelectSnapshot={onSelectSnapshot}
      />,
    );

    expect(screen.getByRole("table", { name: "Inventory snapshots" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-snapshot-row-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("infra-drift-snapshot-selected-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByText("Dev")).toBeInTheDocument();
  });

  it("calls onSelectSnapshot when a row is clicked", () => {
    const onSelectSnapshot = vi.fn();

    render(
      <DriftSnapshotsTable
        snapshots={[snapshot()]}
        selectedSnapshotId=""
        loading={false}
        onSelectSnapshot={onSelectSnapshot}
      />,
    );

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-row-11111111-1111-1111-1111-111111111111"));

    expect(onSelectSnapshot).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
  });
});
