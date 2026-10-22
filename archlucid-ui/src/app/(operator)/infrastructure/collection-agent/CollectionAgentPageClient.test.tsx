import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CollectionAgentPageClient,
  collectionRunStartedUtcDisplay,
  collectionRunStatusLabel,
} from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";

const useCollectionRunsQueryMock = vi.fn();
const useTriggerCollectionRunMutationMock = vi.fn();

vi.mock("@/hooks/use-collection-runs-query", () => ({
  useCollectionRunsQuery: () => useCollectionRunsQueryMock(),
  useTriggerCollectionRunMutation: () => useTriggerCollectionRunMutationMock(),
}));

function successfulRun() {
  return {
    agentVersion: "1.0.0",
    errorSummary: null,
    finishedUtc: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    importedSnapshotId: "snapshot-1",
    projectId: "project",
    runId: "run-1",
    schedule: null,
    startedUtc: "2026-10-11T21:55:00.000Z",
    status: "Succeeded",
    subscriptionsCoveredJson: '["subscription-1"]',
    tenantId: "tenant",
    workspaceId: "workspace",
    zipPath: null,
    zipSha256: null,
  };
}

describe("collection agent omission copy (P-16, P-17)", () => {
  it("labels missing capture status and start time without Unknown", () => {
    expect(collectionRunStatusLabel(undefined)).toBe("Capture status was not stored.");
    expect(collectionRunStartedUtcDisplay(undefined)).toBe("Start time was not stored.");
    expect(collectionRunStartedUtcDisplay("")).toBe("Start time was not stored.");
    expect(collectionRunStartedUtcDisplay("not-a-timestamp")).toBe("Start time could not be read.");
    expect(collectionRunStatusLabel("Running")).toBe("Running");
  });

  it("does not link View changes when imported snapshot id is empty", () => {
    useTriggerCollectionRunMutationMock.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: vi.fn(),
    });
    useCollectionRunsQueryMock.mockReturnValue({
      data: [{ ...successfulRun(), importedSnapshotId: "" }],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByText("Imported snapshot was not stored.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open drift for this snapshot" })).not.toBeInTheDocument();
  });
});

describe("CollectionAgentPageClient", () => {
  beforeEach(() => {
    useCollectionRunsQueryMock.mockReset();
    useTriggerCollectionRunMutationMock.mockReset();
    useTriggerCollectionRunMutationMock.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: vi.fn(),
    });
  });

  it("labels a successful run with missing finish time (P-17)", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [{ ...successfulRun(), finishedUtc: null }],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByText("Last successful run finish time was not stored.")).toBeInTheDocument();
    expect(screen.queryByText("No successful run recorded")).not.toBeInTheDocument();
  });

  it("shows collection health and links an imported snapshot to Changes & drift", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [successfulRun()],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByRole("heading", { name: "Collection Agent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeEnabled();
    expect(screen.getByLabelText("Status: Ready")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open drift for this snapshot" })).toHaveAttribute(
      "href",
      "/infrastructure/snapshots-drift?snapshotId=snapshot-1",
    );
  });

  it("shows the reported schedule and disables Run now while a run is active", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [{ ...successfulRun(), status: "Running", finishedUtc: null, schedule: "Daily at 02:00 UTC" }],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByText("Schedule reported on a collection run: Daily at 02:00 UTC")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeDisabled();
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Running");
  });

  it("shows trigger failures inline", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [successfulRun()],
      isPending: false,
      isError: false,
    });
    useTriggerCollectionRunMutationMock.mockReturnValue({
      error: new Error("Collection is not configured."),
      isPending: false,
      mutateAsync: vi.fn(),
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByRole("alert")).toHaveTextContent("Collection is not configured.");
    expect(screen.getByRole("button", { name: "Run now" })).toBeEnabled();
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
    expect(screen.queryByLabelText("Status: Blocked")).not.toBeInTheDocument();
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
