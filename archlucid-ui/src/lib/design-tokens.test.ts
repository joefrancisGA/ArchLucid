import { describe, expect, it } from "vitest";

import {
  OPERATOR_TYPE_SCALE,
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
  it("four-tier scale uses 20/16/13/12/11px steps", () => {
    expect(OPERATOR_TYPE_SCALE.title).toContain("text-xl");
    expect(OPERATOR_TYPE_SCALE.cardTitle).toContain("text-base");
    expect(OPERATOR_TYPE_SCALE.section).toContain("text-sm");
    expect(OPERATOR_TYPE_SCALE.body).toContain("text-[13px]");
    expect(OPERATOR_TYPE_SCALE.meta).toContain("text-xs");
    expect(OPERATOR_TYPE_SCALE.micro).toContain("text-[11px]");
  });

  it("page titles align with title tier (20px)", () => {
    expect(OPERATOR_TYPOGRAPHY.pageTitle).toBe(OPERATOR_TYPE_SCALE.title);
    expect(OPERATOR_TYPOGRAPHY.pageTitle).not.toContain("text-2xl");
  });

  it("section titles use 13px semibold without uppercase", () => {
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("text-sm");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("font-semibold");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).not.toContain("uppercase");
  });

  it("KPI values use mono tabular scale separate from page titles", () => {
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("text-4xl");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("font-mono");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("tabular-nums");
  });

  it("badge typography uses 11px medium scale for status chips", () => {
    expect(OPERATOR_TYPOGRAPHY.badge).toContain("text-[11px]");
    expect(OPERATOR_TYPOGRAPHY.badge).toContain("font-medium");
  });
});
