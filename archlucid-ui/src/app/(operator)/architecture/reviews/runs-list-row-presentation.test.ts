import { describe, expect, it } from "vitest";

import {
  displayRelativeCreated,
  RUN_CREATED_TIME_NOT_STORED_COPY,
} from "@/app/(operator)/architecture/reviews/runs-list-row-presentation";
import type { RunSummary } from "@/types/authority";

function run(createdUtc: string | null): RunSummary {
  return {
    runId: "run-1",
    projectId: "project-1",
    createdUtc: createdUtc ?? "",
    hasGoldenManifest: false,
  } as RunSummary;
}

describe("displayRelativeCreated", () => {
  it("labels missing or unreadable created timestamps", () => {
    expect(displayRelativeCreated(run(""))).toBe(RUN_CREATED_TIME_NOT_STORED_COPY);
    expect(displayRelativeCreated(run("not-a-date"))).toBe(RUN_CREATED_TIME_NOT_STORED_COPY);
  });
});
