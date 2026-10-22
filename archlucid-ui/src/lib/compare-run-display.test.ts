import { describe, expect, it } from "vitest";

import { compareRunHeadingLabel } from "@/lib/compare-run-display";
import type { RunSummary } from "@/types/authority";

function row(overrides: Partial<RunSummary>): RunSummary {
  return {
    runId: "rid",
    projectId: "default",
    createdUtc: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("compareRunHeadingLabel", () => {
  it("prefers API-backed label when picked summary matches the run id", () => {
    const picked = row({
      runId: "abc",
      displayName: "Human label",
      description: "Ignored when displayName is set",
    });

    expect(compareRunHeadingLabel("abc", picked)).toBe("Human label");
  });

  it("ignores picked summary when ids differ", () => {
    const picked = row({ runId: "other", displayName: "Wrong row" });

    expect(compareRunHeadingLabel("abc", picked)).toBe("abc");
  });

  it("uses demo slug mapping when no usable picked summary", () => {
    expect(compareRunHeadingLabel("claims-intake-run-v1", null)).toBe("Baseline Claims Intake Review");
  });
});
