import { describe, expect, it } from "vitest";

import { deriveReviewPipelineStallDiagnosis, deriveReviewPipelineTerminalFailureDiagnosis } from "@/lib/review-pipeline-stall-diagnosis";
import type { RunSummary } from "@/types/authority";

const baseSummary: RunSummary = {
  runId: "run-1",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
};

describe("deriveReviewPipelineStallDiagnosis", () => {
  it("flags dead-lettered runs", () => {
    const diagnosis = deriveReviewPipelineStallDiagnosis({
      summary: baseSummary,
      diagnosticContext: {
        isDeadLettered: true,
        lastFailureReason: "authority_pipeline_dead_letter",
      },
      elapsedMinutes: 20,
    });

    expect(diagnosis?.headline).toMatch(/dead-lettered/i);
    expect(diagnosis?.detail).toContain("authority_pipeline_dead_letter");
  });

  it("flags zero-stage stalls after 15 minutes", () => {
    const diagnosis = deriveReviewPipelineStallDiagnosis({
      summary: baseSummary,
      diagnosticContext: { legacyRunStatus: "Created" },
      elapsedMinutes: 56,
    });

    expect(diagnosis?.headline).toMatch(/no pipeline stage has started/i);
    expect(diagnosis?.detail).toMatch(/AuthorityPipelineWorkHostedService/i);
  });

  it("returns null for healthy in-progress reviews under threshold", () => {
    const diagnosis = deriveReviewPipelineStallDiagnosis({
      summary: {
        ...baseSummary,
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
      },
      elapsedMinutes: 10,
    });

    expect(diagnosis).toBeNull();
  });
});

describe("deriveReviewPipelineTerminalFailureDiagnosis", () => {
  it("returns dead-letter detail immediately without elapsed time", () => {
    const diagnosis = deriveReviewPipelineTerminalFailureDiagnosis({
      summary: baseSummary,
      diagnosticContext: {
        isDeadLettered: true,
        lastFailureReason: "authority_pipeline_dead_letter",
      },
    });

    expect(diagnosis?.headline).toMatch(/dead-lettered/i);
    expect(diagnosis?.detail).toContain("authority_pipeline_dead_letter");
  });

  it("returns zero-stage failed detail immediately", () => {
    const diagnosis = deriveReviewPipelineTerminalFailureDiagnosis({
      summary: baseSummary,
      diagnosticContext: {
        legacyRunStatus: "Failed",
        lastFailureReason: "Missing Azure OpenAI deployment configuration",
      },
    });

    expect(diagnosis?.headline).toMatch(/before the first pipeline stage/i);
    expect(diagnosis?.detail).toContain("Missing Azure OpenAI deployment configuration");
  });

  it("returns null for in-progress runs", () => {
    const diagnosis = deriveReviewPipelineTerminalFailureDiagnosis({
      summary: baseSummary,
      diagnosticContext: { legacyRunStatus: "Created" },
    });

    expect(diagnosis).toBeNull();
  });
});
