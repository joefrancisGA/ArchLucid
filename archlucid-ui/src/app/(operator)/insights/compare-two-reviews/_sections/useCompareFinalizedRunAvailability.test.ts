import { describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

const useAskProjectRunsQuery = vi.fn();

vi.mock("@/hooks/use-ask-project-runs-query", () => ({
  useAskProjectRunsQuery: (...args: unknown[]) => useAskProjectRunsQuery(...args),
}));

import { useCompareFinalizedRunAvailability } from "./useCompareFinalizedRunAvailability";

function run(overrides: Partial<RunSummary> & Pick<RunSummary, "runId">): RunSummary {
  return {
    runId: overrides.runId,
    hasGoldenManifest: overrides.hasGoldenManifest ?? true,
    demoSeededOverviewInject: overrides.demoSeededOverviewInject,
    isArchived: overrides.isArchived,
  } as RunSummary;
}

describe("useCompareFinalizedRunAvailability", () => {
  it("excludes demo-seeded and showcase rows from finalized compare counts", () => {
    useAskProjectRunsQuery.mockReturnValue({
      isPending: false,
      data: {
        items: [
          run({ runId: "tenant-finalized-a" }),
          run({ runId: "tenant-finalized-b" }),
          run({ runId: "customer-intake-modernization", demoSeededOverviewInject: true }),
          run({ runId: "claims-intake-modernization-run" }),
        ],
      },
    });

    const availability = useCompareFinalizedRunAvailability();

    expect(availability.finalizedCount).toBe(2);
    expect(availability.insufficientForCompare).toBe(false);
    expect(useAskProjectRunsQuery).toHaveBeenCalledWith("default", {
      forCompare: true,
      committedOnly: true,
      mergeDemoOnEmpty: false,
    });
  });

  it("treats a single tenant finalized review as insufficient for compare", () => {
    useAskProjectRunsQuery.mockReturnValue({
      isPending: false,
      data: {
        items: [
          run({ runId: "tenant-finalized-a" }),
          run({ runId: "claims-intake-modernization-run" }),
        ],
      },
    });

    const availability = useCompareFinalizedRunAvailability();

    expect(availability.finalizedCount).toBe(1);
    expect(availability.insufficientForCompare).toBe(true);
  });
});
