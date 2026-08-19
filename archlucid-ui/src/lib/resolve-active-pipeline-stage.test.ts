import { describe, expect, it } from "vitest";

import {
  inferNextPipelineStageName,
  resolveActivePipelineStageRow,
  resolveCurrentPipelineStageLabel,
} from "@/lib/resolve-active-pipeline-stage";
import type { RunSummary } from "@/types/authority";
import type { StageTimelineSummary } from "@/types/stage-timeline";

const baseSummary: RunSummary = {
  runId: "run-1",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

describe("resolveActivePipelineStageRow", () => {
  it("returns the stage that started but has not completed", () => {
    const timeline: StageTimelineSummary[] = [
      {
        stageName: "context_ingestion",
        startedUtc: "2026-01-01T00:00:01.000Z",
        completedUtc: "2026-01-01T00:00:02.000Z",
        outcomeStatus: "Succeeded",
      },
      {
        stageName: "findings",
        startedUtc: "2026-01-01T00:00:03.000Z",
        completedUtc: null,
        outcomeStatus: "Running",
      },
    ];

    expect(resolveActivePipelineStageRow(timeline)?.stageName).toBe("findings");
  });

  it("returns the first not-yet-started stage when none are in flight", () => {
    const timeline: StageTimelineSummary[] = [
      {
        stageName: "context_ingestion",
        startedUtc: "2026-01-01T00:00:01.000Z",
        completedUtc: "2026-01-01T00:00:02.000Z",
        outcomeStatus: "Succeeded",
      },
      {
        stageName: "graph",
        startedUtc: "",
        completedUtc: null,
        outcomeStatus: "Pending",
      },
    ];

    expect(resolveActivePipelineStageRow(timeline)?.stageName).toBe("graph");
  });
});

describe("inferNextPipelineStageName", () => {
  it("walks summary snapshot flags in pipeline order", () => {
    expect(inferNextPipelineStageName(null)).toBe("context_ingestion");
    expect(inferNextPipelineStageName(baseSummary)).toBe("context_ingestion");
    expect(
      inferNextPipelineStageName({ ...baseSummary, hasContextSnapshot: true }),
    ).toBe("graph");
    expect(
      inferNextPipelineStageName({
        ...baseSummary,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
      }),
    ).toBe("findings");
  });
});

describe("resolveCurrentPipelineStageLabel", () => {
  it("prefers the active timeline row over summary inference", () => {
    const timeline: StageTimelineSummary[] = [
      {
        stageName: "decisioning",
        startedUtc: "2026-01-01T00:00:03.000Z",
        completedUtc: null,
        outcomeStatus: "Running",
      },
    ];

    expect(
      resolveCurrentPipelineStageLabel(timeline, baseSummary, true),
    ).toBe("Checking policy compliance");
  });
});
