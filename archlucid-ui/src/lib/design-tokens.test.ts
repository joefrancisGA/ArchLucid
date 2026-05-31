import { describe, expect, it } from "vitest";

import {
  OPERATOR_TYPOGRAPHY,
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

describe("design-tokens TB-119 typography", () => {
  it("page titles cap at text-xl with weight + tracking", () => {
    expect(OPERATOR_TYPOGRAPHY.pageTitle).toContain("text-xl");
    expect(OPERATOR_TYPOGRAPHY.pageTitle).toContain("font-semibold");
    expect(OPERATOR_TYPOGRAPHY.pageTitle).not.toContain("text-2xl");
  });

  it("section titles use size + weight + case, not color alone", () => {
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("text-xs");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("font-semibold");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("uppercase");
  });

  it("KPI values use mono tabular scale separate from page titles", () => {
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("text-4xl");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("font-mono");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("tabular-nums");
  });
});
