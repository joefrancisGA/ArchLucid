import { describe, expect, it } from "vitest";

import {
  operatorConfidenceSurface,
  operatorSemanticBadge,
  operatorSemanticSurface,
} from "@/lib/design-tokens";

describe("design-tokens TB-115 surfaces", () => {
  it("operatorSemanticSurface returns neutral raised surfaces without pastel fills", () => {
    expect(operatorSemanticSurface("ready")).toContain("bg-al-surface-raised");
    expect(operatorSemanticSurface("ready")).not.toContain("bg-emerald-50");
    expect(operatorSemanticSurface("warn")).not.toContain("bg-amber-50");
    expect(operatorSemanticSurface("current")).toContain("border-l-[var(--al-accent-interactive)]");
  });

  it("operatorSemanticBadge uses status token variables", () => {
    expect(operatorSemanticBadge("ready")).toContain("--al-status-ready-bg");
    expect(operatorSemanticBadge("warn")).toContain("--al-status-warn-bg");
  });

  it("operatorConfidenceSurface maps proof disposition tones", () => {
    expect(operatorConfidenceSurface("high")).toBe(operatorSemanticSurface("ready"));
    expect(operatorConfidenceSurface("low")).toBe(operatorSemanticSurface("blocked"));
  });
});
