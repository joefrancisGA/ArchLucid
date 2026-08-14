import { describe, expect, it } from "vitest";

import {
  isCommittedRunSummary,
  pickPriorForSameRequestFromRunSummaries,
} from "@/components/BeforeAfterDelta/pick-prior-from-run-summaries";
import type { RunSummary } from "@/types/authority";

function summary(
  runId: string,
  requestId: string,
  completedUtc: string,
  currentManifestVersion = "1.0.0",
): RunSummary {
  return {
    runId,
    projectId: "default",
    requestId,
    createdUtc: completedUtc,
    completedUtc,
    currentManifestVersion,
    status: "Committed",
    systemName: "sys",
  };
}

describe("pickPriorForSameRequestFromRunSummaries", () => {
  it("returns the latest prior committed run for the same request", () => {
    const current = summary("run-3", "req-a", "2026-01-03T12:00:00Z");
    const rows = [
      summary("run-1", "req-a", "2026-01-01T12:00:00Z"),
      summary("run-2", "req-a", "2026-01-02T12:00:00Z"),
      summary("run-other", "req-b", "2026-01-02T12:00:00Z"),
      current,
    ];

    const prior = pickPriorForSameRequestFromRunSummaries(current, rows);

    expect(prior?.runId).toBe("run-2");
  });

  it("returns null when no committed prior exists for the request", () => {
    const current = summary("run-1", "req-a", "2026-01-01T12:00:00Z");

    expect(pickPriorForSameRequestFromRunSummaries(current, [current])).toBeNull();
  });

  it("treats golden manifest id as committed when manifest version is absent", () => {
    const current = summary("run-2", "req-a", "2026-01-02T12:00:00Z", "");
    current.goldenManifestId = "manifest-1";

    const prior = summary("run-1", "req-a", "2026-01-01T12:00:00Z", "");
    prior.goldenManifestId = "manifest-0";

    expect(isCommittedRunSummary(current)).toBe(true);
    expect(pickPriorForSameRequestFromRunSummaries(current, [prior, current])?.runId).toBe("run-1");
  });
});
