import { describe, expect, it } from "vitest";

import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";
import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import type { RunSummary } from "@/types/authority";

function summary(mode: RunSummary["structuralExecutionMode"]): RunSummary {
  return { runId: "run-1", structuralExecutionMode: mode } as RunSummary;
}

describe("resolveCompareExecutionModeHonesty", () => {
  it("returns null when both runs omit execution mode", () => {
    expect(resolveCompareExecutionModeHonesty(null, null)).toBeNull();
  });

  it("flags mode mismatch between baseline and updated", () => {
    const honesty = resolveCompareExecutionModeHonesty(
      summary(StructuralExecutionModeWire.Real),
      summary(StructuralExecutionModeWire.Simulator),
    );

    expect(honesty?.modesDiffer).toBe(true);
    expect(honesty?.advisoryParagraph).toContain("may not be directly comparable");
    expect(honesty?.advisoryParagraph).toContain("trust labels");
  });

  it("warns when both sides share a non-real mode", () => {
    const honesty = resolveCompareExecutionModeHonesty(
      summary(StructuralExecutionModeWire.Fallback),
      summary(StructuralExecutionModeWire.Fallback),
    );

    expect(honesty?.modesDiffer).toBe(false);
    expect(honesty?.anyNonReal).toBe(true);
    expect(honesty?.advisoryParagraph).toContain("directional only");
  });

  it("returns null advisory when both runs are Real", () => {
    const honesty = resolveCompareExecutionModeHonesty(
      summary(StructuralExecutionModeWire.Real),
      summary(StructuralExecutionModeWire.Real),
    );

    expect(honesty?.modesDiffer).toBe(false);
    expect(honesty?.anyNonReal).toBe(false);
    expect(honesty?.advisoryParagraph).toBeNull();
  });
});
