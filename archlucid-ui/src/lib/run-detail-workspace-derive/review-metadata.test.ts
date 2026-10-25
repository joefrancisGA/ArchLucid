import { describe, expect, it } from "vitest";

import { deriveLastEvaluatedLabel } from "./review-metadata";

describe("deriveLastEvaluatedLabel (P-01–P-03)", () => {
  it("does not fall back to run.createdUtc when completed and manifest times are absent", () => {
    const label = deriveLastEvaluatedLabel(
      {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-01-01T00:00:00.000Z",
      },
      null,
    );

    expect(label).toBeNull();
  });

  it("prefers completedUtc over manifest createdUtc", () => {
    const label = deriveLastEvaluatedLabel(
      {
        runId: "run-1",
        projectId: "proj-1",
        createdUtc: "2026-01-01T00:00:00.000Z",
        completedUtc: "2026-01-08T00:00:00.000Z",
      },
      { createdUtc: "2026-01-07T00:00:00.000Z" } as never,
    );

    expect(label).toBe("2026-01-08T00:00:00.000Z");
  });
});
