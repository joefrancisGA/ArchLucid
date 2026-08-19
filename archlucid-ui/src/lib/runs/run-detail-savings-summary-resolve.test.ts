import { describe, expect, it, vi } from "vitest";

import type { RunDetail } from "@/types/authority";

import { resolveRunDetailSavingsSummary } from "@/lib/runs/run-detail-savings-summary-resolve";
import * as roiResolutionPriority from "@/lib/roi-resolution-priority";
import * as runSavingsSummaryFromDetail from "@/lib/runs/run-savings-summary-from-detail";
import * as runSavingsSummaryModel from "@/lib/runs/run-savings-summary-model";

describe("resolveRunDetailSavingsSummary", () => {
  it("returns server savings without invoking lower tiers", async () => {
    const serverModel = { annualizedUsd: 9000, basisFootnotes: ["Tenant-adjusted."], sourceKind: "server-findings" as const };
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(serverModel);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel");
    const clientHoursSpy = vi.spyOn(roiResolutionPriority, "buildRunDetailClientHoursSavingsSummary").mockReturnValue(null);

    const result = await resolveRunDetailSavingsSummary({
      resolvedDetail: {} as RunDetail,
      usedStaticDemoRun: false,
      artifacts: [],
      manifestId: "manifest-1",
      routeRunId: "run-1",
    });

    expect(result).toEqual(serverModel);
    expect(fromDetailSpy).toHaveBeenCalledOnce();
    expect(loadModelSpy).toHaveBeenCalledOnce();
    expect(clientHoursSpy).toHaveBeenCalledOnce();

    fromDetailSpy.mockRestore();
    loadModelSpy.mockRestore();
    clientHoursSpy.mockRestore();
  });

  it("falls back to client hours when server and extractor savings are absent", async () => {
    const clientModel = { annualizedUsd: 1200, basisFootnotes: ["Client."], sourceKind: "client-hours-estimate" as const };
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(null);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel").mockResolvedValue(null);
    const clientHoursSpy = vi.spyOn(roiResolutionPriority, "buildRunDetailClientHoursSavingsSummary").mockReturnValue(clientModel);

    const result = await resolveRunDetailSavingsSummary({
      resolvedDetail: {} as RunDetail,
      usedStaticDemoRun: false,
      artifacts: [{ artifactId: "a1", name: "cost-actual.json", artifactType: "json", sizeBytes: 1 }],
      manifestId: "manifest-1",
      routeRunId: "run-1",
    });

    expect(result).toEqual(clientModel);
    expect(loadModelSpy).toHaveBeenCalledOnce();

    fromDetailSpy.mockRestore();
    loadModelSpy.mockRestore();
    clientHoursSpy.mockRestore();
  });

  it("allows static demo savings only after higher tiers fail", async () => {
    const demoModel = { annualizedUsd: 12000, basisFootnotes: ["Demonstration KPI."], sourceKind: "static-demo" as const };
    const fromDetailSpy = vi.spyOn(runSavingsSummaryFromDetail, "resolveRunSavingsSummaryFromRunDetail").mockReturnValue(null);
    const loadModelSpy = vi.spyOn(runSavingsSummaryModel, "loadRunSavingsSummaryModel").mockResolvedValue(demoModel);
    const clientHoursSpy = vi.spyOn(roiResolutionPriority, "buildRunDetailClientHoursSavingsSummary").mockReturnValue(null);

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
    clientHoursSpy.mockRestore();
  });
});
