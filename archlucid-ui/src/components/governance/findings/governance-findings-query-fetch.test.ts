import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  collectTraceRowsWithConcurrencyCap,
  GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT,
} from "@/components/governance/findings/governance-findings-query-fetch";

const { getRunExplanationSummaryMock } = vi.hoisted(() => ({
  getRunExplanationSummaryMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: getRunExplanationSummaryMock,
}));

vi.mock("@/components/governance/findings/governance-findings-row-mappers", () => ({
  traceRowsForRun: (run: RunSummary) => [{ id: run.runId, title: run.title ?? run.runId }],
}));

function buildRuns(count: number): RunSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    runId: `run-${index}`,
    title: `Run ${index}`,
  }));
}

describe("collectTraceRowsWithConcurrencyCap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRunExplanationSummaryMock.mockImplementation(async (runId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        findingTraceConfidences: [{ findingId: `${runId}-finding`, findingTitle: "Finding" }],
      };
    });
  });

  it("never exceeds the configured concurrent summary fetch limit", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    getRunExplanationSummaryMock.mockImplementation(async (runId: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);

      await new Promise((resolve) => setTimeout(resolve, 5));

      inFlight -= 1;

      return {
        findingTraceConfidences: [{ findingId: `${runId}-finding`, findingTitle: "Finding" }],
      };
    });

    const runs = buildRuns(10);
    await collectTraceRowsWithConcurrencyCap(runs, GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT);

    expect(maxInFlight).toBeLessThanOrEqual(GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT);
    expect(getRunExplanationSummaryMock).toHaveBeenCalledTimes(10);
  });
});
