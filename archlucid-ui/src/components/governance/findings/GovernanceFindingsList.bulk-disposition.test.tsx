import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

const recordBulkFindingDisposition = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
}));

vi.mock("@/app/(operator)/governance/findings/GovernanceFindingsQueueDesktopTable", () => ({
  GovernanceFindingsQueueDesktopTable: () => <div data-testid="findings-table-stub" />,
}));

vi.mock("@/components/governance/findings/GovernanceFindingRow", () => ({
  GovernanceFindingRow: () => null,
}));

import { GovernanceFindingsList } from "./GovernanceFindingsList";

const sampleRow: GovernanceFindingQueueRow = {
  recordKind: "finding",
  runId: "run-1",
  findingId: "f1",
  title: "Open ingress",
  severity: "Warning",
  status: "Open",
  resourceLabel: "api-gateway",
  disposition: null,
  updatedAtUtc: "2026-08-09T00:00:00.000Z",
};

function Harness() {
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set(["f1"]));

  return (
    <GovernanceFindingsList
      displayedRows={[sampleRow]}
      buyerPolishedShell={false}
      groupByResource={false}
      selectedFindingIds={selectedFindingIds}
      onSelectionChange={setSelectedFindingIds}
      onBulkApplied={() => {
        setSelectedFindingIds(new Set());
      }}
    />
  );
}

describe("GovernanceFindingsList bulk disposition (TB-2114)", () => {
  it("keeps durable success callout visible after selection clears", async () => {
    recordBulkFindingDisposition.mockResolvedValue({ processedCount: 1 });

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Shared reason"), {
      target: { value: "Reviewed with architecture board." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(screen.getByTestId("mutation-reversibility-notice-governance_bulk_disposition")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply disposition" }));

    await waitFor(() => {
      expect(screen.getByTestId("governance-bulk-disposition-success-callout")).toHaveTextContent(
        "Marked 1 finding(s) as accepted.",
      );
      expect(
        screen.getByTestId("governance-bulk-disposition-success-callout-record-correction"),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId("governance-findings-bulk-actions")).not.toBeInTheDocument();
  });
});
