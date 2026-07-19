import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import { buildSignedRecordsListRowsFromRuns } from "./signed-records-list-row";

const finalizedRun: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000099",
  projectId: "default",
  description: "Claims modernization",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: false,
  hasFindingsSnapshot: true,
  hasGoldenManifest: true,
};

const inProgressRun: RunSummary = {
  ...finalizedRun,
  runId: "00000000-0000-0000-0000-000000000088",
  hasGoldenManifest: false,
};

describe("buildSignedRecordsListRowsFromRuns", () => {
  it("keeps only runs with a golden manifest", () => {
    const rows = buildSignedRecordsListRowsFromRuns([finalizedRun, inProgressRun]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.runId).toBe(finalizedRun.runId);
    expect(rows[0]?.reviewHref).toBe(`/reviews/${encodeURIComponent(finalizedRun.runId)}`);
    expect(rows[0]?.signedRecordHref).toBeNull();
  });
});
