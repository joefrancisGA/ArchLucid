import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CollectionAgentPageClient } from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";

const useCollectionRunsQueryMock = vi.fn();

vi.mock("@/hooks/use-collection-runs-query", () => ({
  useCollectionRunsQuery: () => useCollectionRunsQueryMock(),
}));

function successfulRun() {
  return {
    agentVersion: "1.0.0",
    errorSummary: null,
    finishedUtc: "2026-10-11T22:00:00.000Z",
    importedSnapshotId: "snapshot-1",
    projectId: "project",
    runId: "run-1",
    startedUtc: "2026-10-11T21:55:00.000Z",
    status: "Succeeded",
    subscriptionsCoveredJson: '["subscription-1"]',
    tenantId: "tenant",
    workspaceId: "workspace",
    zipPath: null,
    zipSha256: null,
  };
}

describe("CollectionAgentPageClient", () => {
  beforeEach(() => {
    useCollectionRunsQueryMock.mockReset();
  });

  it("shows collection health and links an imported snapshot to Changes & drift", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [successfulRun()],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByRole("heading", { name: "Collection agent" })).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Ready")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View changes" })).toHaveAttribute(
      "href",
      "/infrastructure/snapshots-drift?snapshotId=snapshot-1",
    );
  });

  it("expands a failed run to show its error summary", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [{ ...successfulRun(), runId: "run-2", status: "Failed", errorSummary: "Reader denied" }],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    fireEvent.click(screen.getAllByRole("row")[1]!);

    expect(screen.getByText("Reader denied")).toBeInTheDocument();
  });

  it("shows empty and failed-load states without an empty table", () => {
    useCollectionRunsQueryMock.mockReturnValue({ data: [], isPending: false, isError: false });
    const { rerender } = render(<CollectionAgentPageClient />);

    expect(screen.getByText("No collection runs yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    useCollectionRunsQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error("API unavailable"),
    });
    rerender(<CollectionAgentPageClient />);

    expect(screen.getByRole("alert")).toHaveTextContent("API unavailable");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
