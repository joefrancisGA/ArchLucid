import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewWorkspaceStaleBanner } from "@/components/reviews/ReviewWorkspaceStaleBanner";

const summaryByRunId = new Map<string, {
  authorityLifecyclePhase: string;
  hasGoldenManifest: boolean;
  runDegradedExecution: boolean;
}>();

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: (runId: string) => ({
    data: summaryByRunId.get(runId),
    refetch: vi.fn(),
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
});
