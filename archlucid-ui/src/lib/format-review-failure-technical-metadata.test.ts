import { describe, expect, it } from "vitest";

import { formatReviewFailureTechnicalMetadataRows } from "./format-review-failure-technical-metadata";

describe("format-review-failure-technical-metadata", () => {
  it("includes structured failure fields for deferred-pipeline invalidOperation", () => {
    const rows = formatReviewFailureTechnicalMetadataRows({
      runId: "run-abc",
      lastFailureSummary: {
        failureClass: "invalidOperation",
        reasonCode: "NoScheduledAgentTasks",
      },
      diagnosticContext: {
        legacyRunStatus: "Failed",
        lastFailureReason: '{"schemaVersion":1,"failureClass":"invalidOperation","reasonCode":"NoScheduledAgentTasks"}',
        otelTraceId: "637db8b7-0000-4000-8000-000000000001",
      },
      pipelineSummary: {
        runId: "run-abc",
        hasContextSnapshot: false,
        hasGraphSnapshot: false,
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
      failureRecordedAtUtc: "2026-09-05T20:42:26.000Z",
      retryCount: 0,
    });

    const byLabel = Object.fromEntries(rows.map((row) => [row.label, row.value]));

    expect(byLabel["Review id"]).toBe("run-abc");
    expect(byLabel["Failure class"]).toBe("invalidOperation");
    expect(byLabel["Reason code"]).toBe("NoScheduledAgentTasks");
    expect(byLabel["Assessment progress"]).toBe("0 / 4 assessment steps");
    expect(byLabel["Likely cause"]).toContain("agent tasks were scheduled");
    expect(byLabel["Last failure reason (stored)"]).toContain("NoScheduledAgentTasks");
    expect(byLabel["OpenTelemetry trace id"]).toBe("637db8b7-0000-4000-8000-000000000001");
  });

  it("does not invent assessment progress when pipeline summary is absent (P-20)", () => {
    const rows = formatReviewFailureTechnicalMetadataRows({
      runId: "run-abc",
      lastFailureSummary: { failureClass: "invalidOperation" },
    });

    const byLabel = Object.fromEntries(rows.map((row) => [row.label, row.value]));

    expect(byLabel["Assessment progress"]).toBe("Assessment progress was not stored.");
    expect(byLabel["Assessment step flags"]).toBe("Assessment progress was not stored.");
  });
});
