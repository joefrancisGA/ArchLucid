import { describe, expect, it, vi } from "vitest";

import type { RunDetail } from "@/types/authority";

import { resolveRunDetailSavingsSummary } from "./run-detail-savings-summary-resolve";
import * as runSavingsSummaryFromDetail from "./run-savings-summary-from-detail";
import * as runSavingsSummaryModel from "./run-savings-summary-model";

describe("resolveRunDetailSavingsSummary", () => {
  it("returns server savings without invoking artifact heuristics", async () => {
    const serverModel = { annualizedUsd: 9000, basisFootnotes: ["Tenant-adjusted."], sourceKind: "server-findings" as const };
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(serverModel);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel");

    const result = await resolveRunDetailSavingsSummary({
      resolvedDetail: {} as RunDetail,
      usedStaticDemoRun: false,
      artifacts: [],
      manifestId: "manifest-1",
      routeRunId: "run-1",
    });

    expect(result).toEqual(serverModel);
    expect(fromDetailSpy).toHaveBeenCalledOnce();
    expect(loadModelSpy).not.toHaveBeenCalled();

    fromDetailSpy.mockRestore();
    loadModelSpy.mockRestore();
  });

  it("skips artifact heuristics for live runs when server savings are absent", async () => {
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(null);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel");

    const result = await resolveRunDetailSavingsSummary({
      resolvedDetail: {} as RunDetail,
      usedStaticDemoRun: false,
      artifacts: [{ artifactId: "a1", name: "cost-actual.json", artifactType: "json", sizeBytes: 1 }],
      manifestId: "manifest-1",
      routeRunId: "run-1",
    });

    expect(result).toBeNull();
    expect(loadModelSpy).not.toHaveBeenCalled();

    fromDetailSpy.mockRestore();
    loadModelSpy.mockRestore();
  });

  it("allows demo artifact heuristics only for static demo runs", async () => {
    const demoModel = { annualizedUsd: 12000, basisFootnotes: ["Demonstration KPI."], sourceKind: "static-demo" as const };
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(null);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel").mockResolvedValue(demoModel);

    const result = await resolveRunDetailSavingsSummary({
      resolvedDetail: {} as RunDetail,
      usedStaticDemoRun: true,
      artifacts: [],
      manifestId: null,
      routeRunId: "demo-run",
    });

    expect(result).toEqual(demoModel);
    expect(loadModelSpy).toHaveBeenCalledOnce();

    fromDetailSpy.mockRestore();
    loadModelSpy.mockRestore();
  });
});
