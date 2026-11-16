import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CollectionAgentPageClient,
  collectionRunStartedUtcDisplay,
  collectionRunStatusLabel,
} from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";
import { fetchCollectionRuns, triggerCollectionRun } from "@/lib/collection-runs-api";

const useCollectionRunsQueryMock = vi.fn();
const useTriggerCollectionRunMutationMock = vi.fn();

vi.mock("@/hooks/use-collection-runs-query", () => ({
  useCollectionRunsQuery: () => useCollectionRunsQueryMock(),
  useTriggerCollectionRunMutation: () => useTriggerCollectionRunMutationMock(),
}));

vi.mock("@/lib/collection-runs-api", () => ({
  fetchCollectionRuns: vi.fn(),
  triggerCollectionRun: vi.fn(),
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
    expect(collectionRunStatusLabel("Running")).toBe("Collection is running.");
  });

  it("does not link View changes when imported snapshot id is empty", () => {
    useTriggerCollectionRunMutationMock.mockReturnValue({
      error: null,
      isPending: false,
      mutate: vi.fn(),
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
      mutate: vi.fn(),
    });
  });

  it.each([
    [null, "Last successful run finish time was not stored."],
    ["   ", "Last successful run finish time was not stored."],
    ["unreadable-finish", "Last successful run finish time could not be read."],
  ] as const)("labels the successful run when the finish time is %s (P-17)", (finishedUtc, expectedLabel) => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [{ ...successfulRun(), finishedUtc }],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
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

  it("orders collection runs by UTC when timestamp suffixes differ", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [
        { ...successfulRun(), runId: "older", finishedUtc: "2026-10-11T18:00:00", importedSnapshotId: "older" },
        { ...successfulRun(), runId: "newer", finishedUtc: "2026-10-11T20:00:00Z", importedSnapshotId: "newer" },
      ],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getAllByRole("link", { name: "Open drift for this snapshot" })[0]).toHaveAttribute(
      "href",
      "/infrastructure/snapshots-drift?snapshotId=newer",
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
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Collection is running.");
  });

  it("orders dated runs ahead of undated runs and reports the newest schedule", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [
        { ...successfulRun(), runId: "older", finishedUtc: "2026-10-11T18:00:00Z", importedSnapshotId: "older", schedule: "Old schedule" },
        { ...successfulRun(), runId: "undated", startedUtc: undefined, finishedUtc: null, importedSnapshotId: "undated", schedule: "Undated schedule" },
        { ...successfulRun(), runId: "newer", startedUtc: "2026-10-11T20:00:00Z", finishedUtc: "invalid", importedSnapshotId: "newer", schedule: "New schedule" },
      ],
      isPending: false,
      isError: false,
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getAllByRole("link", { name: "Open drift for this snapshot" }).map((link) => link.getAttribute("href"))).toEqual([
      "/infrastructure/snapshots-drift?snapshotId=newer",
      "/infrastructure/snapshots-drift?snapshotId=older",
      "/infrastructure/snapshots-drift?snapshotId=undated",
    ]);
    expect(screen.getByText("Schedule reported on a collection run: New schedule")).toBeInTheDocument();
  });

  it("reuses the trigger key after an ambiguous failure and rotates it after success", async () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [successfulRun()],
      isPending: false,
      isError: false,
    });
    const { useTriggerCollectionRunMutation } = await vi.importActual<
      typeof import("@/hooks/use-collection-runs-query")
    >("@/hooks/use-collection-runs-query");
    useTriggerCollectionRunMutationMock.mockImplementation(useTriggerCollectionRunMutation);
    vi.mocked(triggerCollectionRun).mockClear()
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce(successfulRun())
      .mockResolvedValueOnce(successfulRun());

    render(
      <QueryClientProvider client={new QueryClient()}>
        <CollectionAgentPageClient />
      </QueryClientProvider>,
    );

    const runButton = screen.getByRole("button", { name: "Run now" });
    fireEvent.click(runButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("Network timeout");
    expect(triggerCollectionRun).toHaveBeenCalledOnce();
    expect(runButton).toBeEnabled();
    const firstKey = vi.mocked(triggerCollectionRun).mock.calls[0]?.[0];

    fireEvent.click(runButton);
    await waitFor(() => expect(triggerCollectionRun).toHaveBeenCalledTimes(2));
    expect(triggerCollectionRun).toHaveBeenNthCalledWith(2, firstKey);
    await waitFor(() => expect(runButton).toBeEnabled());

    fireEvent.click(runButton);
    await waitFor(() => expect(triggerCollectionRun).toHaveBeenCalledTimes(3));
    expect(vi.mocked(triggerCollectionRun).mock.calls[2]?.[0]).not.toBe(firstKey);
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

  it("keeps loaded collection history visible when a refresh times out", async () => {
    const { useCollectionRunsQuery } = await vi.importActual<
      typeof import("@/hooks/use-collection-runs-query")
    >("@/hooks/use-collection-runs-query");
    useCollectionRunsQueryMock.mockImplementation(useCollectionRunsQuery);
    vi.mocked(fetchCollectionRuns)
      .mockResolvedValueOnce([{ ...successfulRun(), status: "Succeeded" }])
      .mockRejectedValueOnce(new Error("Network timeout"));
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <CollectionAgentPageClient />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("table", { name: "Recent collection runs" })).toBeInTheDocument();

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["collection-runs", "list"] });
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Network timeout");
    expect(screen.getByRole("link", { name: "Open drift for this snapshot" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run now" })).toBeDisabled();
  });

  it("hides loaded collection history when a refresh is forbidden", () => {
    useCollectionRunsQueryMock.mockReturnValue({
      data: [successfulRun()],
      isPending: false,
      isError: true,
      isRefetchError: true,
      error: { message: "Forbidden", httpStatus: 403, problem: null, correlationId: null, retryAfterSeconds: null },
    });

    render(<CollectionAgentPageClient />);

    expect(screen.getByRole("alert")).toHaveTextContent("Forbidden");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
