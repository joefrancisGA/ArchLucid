import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchEvolutionCandidates: vi.fn(),
  fetchEvolutionResults: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

import { fetchEvolutionCandidates, fetchEvolutionResults } from "@/lib/api";
import { loadEvolutionReviewPageData } from "./load-evolution-review-page-data";

describe("loadEvolutionReviewPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parallelizes list and detail when candidateId is known", async () => {
    let listStarted = false;
    let detailStartedBeforeListSettled = false;

    vi.mocked(fetchEvolutionCandidates).mockImplementation(async () => {
      listStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 20));

      return {
        candidates: [{ candidateChangeSetId: "c-known", title: "Known" }],
      } as Awaited<ReturnType<typeof fetchEvolutionCandidates>>;
    });

    vi.mocked(fetchEvolutionResults).mockImplementation(async () => {
      detailStartedBeforeListSettled = listStarted;

      return { candidateChangeSetId: "c-known" } as Awaited<ReturnType<typeof fetchEvolutionResults>>;
    });

    const loaded = await loadEvolutionReviewPageData({ candidateId: "c-known" });

    expect(loaded.mode).toBe("live");

    if (loaded.mode === "live") {
      expect(loaded.selectedId).toBe("c-known");
      expect(loaded.detail).not.toBeNull();
      expect(loaded.listFailure).toBeNull();
      expect(loaded.detailFailure).toBeNull();
    }

    expect(detailStartedBeforeListSettled).toBe(true);
    expect(fetchEvolutionCandidates).toHaveBeenCalledTimes(1);
    expect(fetchEvolutionResults).toHaveBeenCalledWith("c-known");
  });
});
