import { describe, expect, it } from "vitest";

import {
  formatFindingInspectReasoningTraceDisplay,
  isFindingInspectReasoningTraceRenderable,
} from "@/lib/findings/finding-inspect-reasoning-trace-display";

describe("finding inspect reasoning trace display", () => {
  it("distinguishes null, empty, and stored rationale traces", () => {
    expect(formatFindingInspectReasoningTraceDisplay(null)).toContain("was not stored");
    expect(formatFindingInspectReasoningTraceDisplay("   ")).toContain("stored empty");
    expect(formatFindingInspectReasoningTraceDisplay("Grounded on policy rule sec-001.")).toBe(
      "Grounded on policy rule sec-001.",
    );
    expect(isFindingInspectReasoningTraceRenderable("")).toBe(false);
    expect(isFindingInspectReasoningTraceRenderable("trace")).toBe(true);
  });
});
