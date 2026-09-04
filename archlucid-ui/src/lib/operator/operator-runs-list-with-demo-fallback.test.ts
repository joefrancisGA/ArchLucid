import { describe, expect, it, vi } from "vitest";

import { enrichRunsListWithStaticDemoFallback } from "./operator-runs-list-with-demo-fallback";
import type { RunSummary } from "@/types/authority";

vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: vi.fn(),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  tryStaticDemoRunSummariesPaged: vi.fn(),
}));

import { isLiveOperatorShellRecoveryContext } from "@/lib/live-operator-shell-recovery";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";

const sampleRun = { runId: "demo-run" } as RunSummary;

describe("enrichRunsListWithStaticDemoFallback", () => {
  it("returns live items unchanged when non-empty", () => {
    vi.mocked(isLiveOperatorShellRecoveryContext).mockReturnValue(true);

    const items = [sampleRun];

    expect(enrichRunsListWithStaticDemoFallback(items, "default")).toEqual(items);
    expect(tryStaticDemoRunSummariesPaged).not.toHaveBeenCalled();
  });

  it("does not substitute showcase rows on live tenants", () => {
    vi.mocked(isLiveOperatorShellRecoveryContext).mockReturnValue(true);

    expect(enrichRunsListWithStaticDemoFallback([], "default")).toEqual([]);
    expect(tryStaticDemoRunSummariesPaged).not.toHaveBeenCalled();
  });

  it("substitutes showcase rows when demo/static is on and list is empty", () => {
    vi.mocked(isLiveOperatorShellRecoveryContext).mockReturnValue(false);
    vi.mocked(tryStaticDemoRunSummariesPaged).mockReturnValue({
      items: [sampleRun],
      totalCount: 1,
      page: 1,
      pageSize: 100,
    });

    expect(enrichRunsListWithStaticDemoFallback([], "default")).toEqual([sampleRun]);
  });
});
