import { describe, expect, it } from "vitest";

import { runRowExplicitCountsLine } from "@/app/(operator)/architecture/reviews/runs-list-row-presentation";
import type { RunSummary } from "@/types/authority";

const base: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000001",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
  findingCount: 2,
};

describe("runRowExplicitCountsLine", () => {
  it("omits package seal wording when hasGoldenManifest is omitted", () => {
    expect(runRowExplicitCountsLine(base, false)).toBe("2 findings");
  });

  it("keeps package seal wording when the manifest flag is known", () => {
    expect(runRowExplicitCountsLine({ ...base, hasGoldenManifest: true }, false)).toBe(
      "2 findings · Package finalized",
    );
    expect(runRowExplicitCountsLine({ ...base, hasGoldenManifest: false }, false)).toBe(
      "2 findings · Package pending",
    );
  });
});
