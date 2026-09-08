import { describe, expect, it } from "vitest";

import { buildCorePilotCommitContextFromRunItems } from "@/lib/core-pilot-commit-context";
import { SHOWCASE_CREATED_STATIC_DEMO_RUN_ID } from "@/lib/showcase-created-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

function runSummary(overrides: Partial<RunSummary>): RunSummary {
  return {
    runId: "tenant-run-1",
    projectId: "default",
    createdUtc: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildCorePilotCommitContextFromRunItems", () => {
  it("does not treat a sample golden-manifest run as the first committed review", () => {
    const context = buildCorePilotCommitContextFromRunItems(
      [
        runSummary({
          runId: SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
          isSample: true,
          hasGoldenManifest: true,
          description:
            "Enterprise Copilot RAG platform — approval-ready created architecture package (synthetic guided-intake sample).",
        }),
      ],
      false,
    );

    expect(context.firstCommittedRunId).toBeNull();
    expect(context.sealedReviewRecord).toBeNull();
    expect(context.hasCommittedManifest).toBe(false);
    expect(context.latestRunId).toBeNull();
  });

  it("does not treat the reviewed showcase sample as tenant progress", () => {
    const context = buildCorePilotCommitContextFromRunItems(
      [
        runSummary({
          runId: SHOWCASE_STATIC_DEMO_RUN_ID,
          hasGoldenManifest: true,
        }),
      ],
      false,
    );

    expect(context.firstCommittedRunId).toBeNull();
    expect(context.latestRunId).toBeNull();
    expect(context.hasCommittedManifest).toBe(false);
  });

  it("uses the first non-sample committed run when samples are mixed with tenant work", () => {
    const context = buildCorePilotCommitContextFromRunItems(
      [
        runSummary({
          runId: SHOWCASE_STATIC_DEMO_RUN_ID,
          hasGoldenManifest: true,
        }),
        runSummary({
          runId: "tenant-sealed-1",
          hasGoldenManifest: true,
          displayName: "Payments platform",
        }),
      ],
      false,
    );

    expect(context.firstCommittedRunId).toBe("tenant-sealed-1");
    expect(context.latestRunId).toBe("tenant-sealed-1");
    expect(context.sealedReviewRecord?.displayName).toBe("Payments platform");
    expect(context.hasCommittedManifest).toBe(true);
  });

  it("prefers the newest tenant run for latestRunId when samples appear first", () => {
    const context = buildCorePilotCommitContextFromRunItems(
      [
        runSummary({
          runId: SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
          isSample: true,
          hasGoldenManifest: true,
        }),
        runSummary({
          runId: "tenant-in-progress",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
        }),
      ],
      false,
    );

    expect(context.latestRunId).toBe("tenant-in-progress");
    expect(context.latestRunReadyToFinalize).toBe(true);
    expect(context.firstCommittedRunId).toBeNull();
  });
});
