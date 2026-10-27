import { describe, expect, it } from "vitest";

import type { RunSummary } from "@/types/authority";

import {
  displayRelativeCreated,
  RUN_CREATED_TIME_NOT_STORED_COPY,
  RUN_LIST_FINDING_COUNT_NOT_STORED_LABEL,
  RUN_LIST_WARNING_COUNT_NOT_STORED_LABEL,
  runRowExplicitCountsLine,
  runRowNumericCountsLine,
  runRowOutputReadinessLine,
  runRowOutputReadinessLineBuyer,
} from "./runs-list-row-presentation";

function run(createdUtc: string | null): RunSummary {
  return {
    runId: "run-1",
    projectId: "project-1",
    createdUtc: createdUtc ?? "",
    hasGoldenManifest: false,
  } as RunSummary;
}

function baseRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    runId: "00000000-0000-0000-0000-000000000001",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("displayRelativeCreated", () => {
  it("labels missing or unreadable created timestamps", () => {
    expect(displayRelativeCreated(run(""))).toBe(RUN_CREATED_TIME_NOT_STORED_COPY);
    expect(displayRelativeCreated(run("not-a-date"))).toBe(RUN_CREATED_TIME_NOT_STORED_COPY);
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
