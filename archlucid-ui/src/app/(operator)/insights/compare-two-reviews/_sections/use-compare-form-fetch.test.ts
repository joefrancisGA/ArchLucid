import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getRunSummary } from "@/lib/api";

import { useCompareFormFetch } from "./use-compare-form-fetch";

vi.mock("@/lib/api", () => ({
  compareGoldenManifestRuns: vi.fn().mockResolvedValue(null),
  compareRuns: vi.fn().mockResolvedValue(null),
  getRunSummary: vi.fn(),
}));

vi.mock("@/lib/api/conversation-api", () => ({
  fetchComparisonNarrativeViaAsk: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  tryStaticDemoGoldenManifestComparison: () => null,
  tryStaticDemoRunComparison: () => null,
}));

function summary(runId: string) {
  return { runId, projectId: "project-1", createdUtc: "2026-10-01T12:00:00Z" };
}

describe("useCompareFormFetch", () => {
  it("keeps the latest pair's summaries when the older pair finishes last", async () => {
    const older = Promise.withResolvers<Awaited<ReturnType<typeof getRunSummary>>>();
    vi.mocked(getRunSummary).mockImplementation((runId) =>
      runId.startsWith("old-") ? older.promise : Promise.resolve(summary(runId)),
    );
    const { result } = renderHook(useCompareFormFetch);

    await act(() => result.current.runCompareForPair("old-left", "old-right"));
    await act(() => result.current.runCompareForPair("new-left", "new-right"));
    expect(result.current.leftPickedSummary?.runId).toBe("new-left");
    expect(result.current.rightPickedSummary?.runId).toBe("new-right");

    await act(async () => {
      older.resolve(summary("old-review"));
    });

    expect(result.current.leftPickedSummary?.runId).toBe("new-left");
    expect(result.current.rightPickedSummary?.runId).toBe("new-right");
  });
});
