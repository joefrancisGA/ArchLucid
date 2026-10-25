import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL,
  RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL,
  RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL,
  runRowExplicitCountsLine,
  runRowNumericCountsLine,
  runRowOutputReadinessLine,
  runRowOutputReadinessLineBuyer,
} from "./runs-list-row-presentation";

const baseRun = (overrides: Partial<RunSummary> = {}): RunSummary => ({
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("runs-list-row-presentation", () => {
  it("reports findings snapshot flag was not stored instead of not started", () => {
    const run = baseRun();

    expect(runRowOutputReadinessLineBuyer(run)).toBe(FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL);
    expect(runRowOutputReadinessLine(run)).toContain(FINDINGS_SNAPSHOT_FLAG_NOT_STORED_LABEL);
  });

  it("reports per-count not stored labels when counts are omitted", () => {
    const line = runRowExplicitCountsLine(
      baseRun({ findingCount: null, warningCount: undefined, artifactCount: 2 }),
      false,
    );

    expect(line).toContain(RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL);
    expect(line).toContain(RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL);
    expect(line).toContain("2 artifacts");
  });

  it("surfaces finding count not stored when it is the only omitted count", () => {
    const line = runRowExplicitCountsLine(baseRun({ findingCount: null }), false);

    expect(line).toContain(RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL);
  });
});

describe("runs-list-row-presentation work queue honesty", () => {
  it("labels omitted finding and warning counts without implying zero", () => {
    const line = runRowNumericCountsLine(
      baseRun({ findingCount: undefined, warningCount: undefined }),
      false,
    );

    expect(line).toContain(RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL);
    expect(line).toContain(RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL);
    expect(line).not.toMatch(/\b0 findings\b/);
  });
});
