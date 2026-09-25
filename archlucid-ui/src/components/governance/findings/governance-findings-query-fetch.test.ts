import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchGovernanceFindingQueueRows,
  collectTraceRowsWithConcurrencyCap,
  GOVERNANCE_FINDINGS_FALLBACK_MAX_CONCURRENT,
} from "@/components/governance/findings/governance-findings-query-fetch";

const {
  getRunExplanationSummaryMock,
  listRunsByProjectPagedMock,
  fetchGovernanceFindingsRegistersBundleMock,
} = vi.hoisted(() => ({
  getRunExplanationSummaryMock: vi.fn(),
  listRunsByProjectPagedMock: vi.fn(),
  fetchGovernanceFindingsRegistersBundleMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: getRunExplanationSummaryMock,
  listRunsByProjectPaged: listRunsByProjectPagedMock,
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  fetchGovernanceFindingsRegistersBundle: fetchGovernanceFindingsRegistersBundleMock,
}));

vi.mock("@/components/governance/findings/governance-findings-row-mappers", () => ({
  dedupeGovernanceFindingRows: (rows: unknown[]) => rows,
  riskRegisterRows: () => [],
  decisionRegisterRows: () => [],
  traceRowsForRun: (run: { runId: string; title?: string }) => [{ id: run.runId, title: run.title ?? run.runId }],
}));

import type { RunSummary } from "@/types/authority";

describe("fetchGovernanceFindingQueueRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchGovernanceFindingsRegistersBundleMock.mockResolvedValue({
      riskRegister: { entries: [] },
      decisionRegister: { decisions: [] },
    });
    listRunsByProjectPagedMock.mockResolvedValue({ items: [{ runId: "run-fallback" }] });
    getRunExplanationSummaryMock.mockResolvedValue({
      findingTraceConfidences: [{ findingId: "finding-1", findingTitle: "Finding" }],
    });
  });

  it("returns successful empty for SecureNow without review fallback", async () => {
    const result = await fetchGovernanceFindingQueueRows(false, "security");

    expect(result).toEqual({ rows: [], loadFailed: false, failure: null });
    expect(listRunsByProjectPagedMock).not.toHaveBeenCalled();
    expect(getRunExplanationSummaryMock).not.toHaveBeenCalled();
  });

  it("falls back to review traces for Architecture when register is empty", async () => {
    const result = await fetchGovernanceFindingQueueRows(false, "architecture");

    expect(result.loadFailed).toBe(false);
    expect(listRunsByProjectPagedMock).toHaveBeenCalledTimes(1);
    expect(getRunExplanationSummaryMock).toHaveBeenCalled();
  });
});

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
