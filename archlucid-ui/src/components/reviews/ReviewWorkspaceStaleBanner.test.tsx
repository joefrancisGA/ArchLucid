import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceStaleBanner } from "@/components/reviews/ReviewWorkspaceStaleBanner";

const summaryByRunId = new Map<string, {
  authorityLifecyclePhase: string;
  hasGoldenManifest: boolean;
  runDegradedExecution: boolean;
  legacyRunStatus?: string;
}>();
const refetch = vi.fn();

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: (runId: string) => ({
    data: summaryByRunId.get(runId),
    refetch,
  }),
}));

describe("ReviewWorkspaceStaleBanner", () => {
  beforeEach(() => {
    summaryByRunId.clear();
    summaryByRunId.set("run-a", {
      authorityLifecyclePhase: "committed",
      hasGoldenManifest: true,
      runDegradedExecution: false,
    });
    summaryByRunId.set("run-b", {
      authorityLifecyclePhase: "in-review",
      hasGoldenManifest: false,
      runDegradedExecution: false,
    });
  });

  it("does not carry the previous run baseline into a client-side run transition", () => {
    const { rerender } = render(<ReviewWorkspaceStaleBanner runId="run-a" />);

    rerender(<ReviewWorkspaceStaleBanner runId="run-b" />);

    expect(screen.queryByTestId("review-workspace-stale-banner")).not.toBeInTheDocument();
  });

  it("keeps the stale warning visible when refresh returns no data", async () => {
    refetch.mockResolvedValue({ data: undefined });
    const { rerender } = render(<ReviewWorkspaceStaleBanner runId="run-a" />);

    summaryByRunId.set("run-a", {
      authorityLifecyclePhase: "in-review",
      hasGoldenManifest: true,
      runDegradedExecution: false,
    });
    rerender(<ReviewWorkspaceStaleBanner runId="run-a" />);

    expect(screen.getByTestId("review-workspace-stale-banner")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Refresh review" }));
      await Promise.resolve();
    });

    expect(screen.getByTestId("review-workspace-stale-banner")).toBeInTheDocument();
  });

  it("shows the stale warning when only the mutable run status changes", () => {
    const { rerender } = render(<ReviewWorkspaceStaleBanner runId="run-a" />);

    summaryByRunId.set("run-a", {
      authorityLifecyclePhase: "committed",
      hasGoldenManifest: true,
      runDegradedExecution: false,
      legacyRunStatus: "Completed",
    });
    rerender(<ReviewWorkspaceStaleBanner runId="run-a" />);

    expect(screen.getByTestId("review-workspace-stale-banner")).toBeInTheDocument();
  });
});
