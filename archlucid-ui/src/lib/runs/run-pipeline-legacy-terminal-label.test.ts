import { describe, expect, it } from "vitest";

import { deriveRunListPipelineLabel } from "@/components/runs/RunStatusBadge";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import {
  isTerminalExecuteLegacyRunStatus,
  resolveTerminalPipelineLabelFromLegacyStatus,
} from "@/lib/runs/run-pipeline-legacy-terminal-label";
import type { RunSummary } from "@/types/authority";

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
  hasFindingsSnapshot: true,
  hasGraphSnapshot: true,
  hasContextSnapshot: true,
};

describe("resolveTerminalPipelineLabelFromLegacyStatus", () => {
  it("maps Failed to failed label even when findings snapshot exists", () => {
    expect(resolveTerminalPipelineLabelFromLegacyStatus("Failed")).toBe(PIPELINE_STATUS_LABELS.failed);
    expect(deriveRunListPipelineLabel({ ...base, legacyRunStatus: "Failed" })).toBe(PIPELINE_STATUS_LABELS.failed);
  });

  it("maps FailedPartial to partially failed label", () => {
    expect(resolveTerminalPipelineLabelFromLegacyStatus("FailedPartial")).toBe(
      PIPELINE_STATUS_LABELS.partiallyFailed,
    );
    expect(deriveRunListPipelineLabel({ ...base, legacyRunStatus: "FailedPartial" })).toBe(
      PIPELINE_STATUS_LABELS.partiallyFailed,
    );
  });

  it("returns null for in-flight legacy statuses", () => {
    expect(resolveTerminalPipelineLabelFromLegacyStatus("TasksGenerated")).toBeNull();
    expect(isTerminalExecuteLegacyRunStatus("WaitingForResults")).toBe(false);
  });
});
