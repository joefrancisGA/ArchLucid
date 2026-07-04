import { describe, expect, it } from "vitest";

import {
  METADATA_STATUS_TAG_SHELL,
  OPERATOR_CARD,
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_LAYOUT,
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

  it("metadata status shell is non-interactive", () => {
    expect(METADATA_STATUS_TAG_SHELL).toContain("cursor-default");
    expect(METADATA_STATUS_TAG_SHELL).toContain("pointer-events-none");
    expect(METADATA_STATUS_TAG_SHELL).not.toContain("hover:");
    expect(METADATA_STATUS_TAG_SHELL).not.toContain("shadow");
  });

  it("operatorConfidenceSurface maps proof disposition tones", () => {
    expect(operatorConfidenceSurface("high")).toBe(operatorSemanticSurface("ready"));
    expect(operatorConfidenceSurface("low")).toBe(operatorSemanticSurface("blocked"));
  });
});

describe("design-tokens TB-119 typography", () => {
  it("canonical scale uses 20/18/15/13/12/11px steps", () => {
    expect(OPERATOR_TYPE_SCALE.pageTitle).toContain("text-xl");
    expect(OPERATOR_TYPE_SCALE.sectionTitle).toContain("text-lg");
    expect(OPERATOR_TYPE_SCALE.cardTitle).toContain("text-[15px]");
    expect(OPERATOR_TYPE_SCALE.body).toContain("text-[13px]");
    expect(OPERATOR_TYPE_SCALE.helper).toContain("text-xs");
    expect(OPERATOR_TYPE_SCALE.navHelper).toContain("text-[11px]");
    expect(OPERATOR_TYPE_SCALE.tab).toContain("leading-4");
  });

  it("page titles align with pageTitle tier (20px)", () => {
    expect(OPERATOR_TYPOGRAPHY.pageTitle).toBe(OPERATOR_TYPE_SCALE.pageTitle);
    expect(OPERATOR_TYPOGRAPHY.pageTitle).not.toContain("text-2xl");
  });

  it("section titles use 18px semibold primary text", () => {
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("text-lg");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).toContain("font-semibold");
    expect(OPERATOR_TYPOGRAPHY.sectionTitle).not.toContain("uppercase");
  });

  it("nav and button roles have dedicated tokens", () => {
    expect(OPERATOR_TYPOGRAPHY.navLabel).toContain("font-medium");
    expect(OPERATOR_TYPOGRAPHY.navHelper).toContain("leading-[15px]");
    expect(OPERATOR_TYPOGRAPHY.button).toContain("font-semibold");
    expect(OPERATOR_TYPOGRAPHY.tab).toContain("leading-4");
  });

  it("KPI values use mono tabular scale separate from page titles", () => {
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("text-4xl");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("font-mono");
    expect(OPERATOR_TYPOGRAPHY.kpiValue).toContain("tabular-nums");
  });

  it("KPI card title and description use tab and helper scales", () => {
    expect(OPERATOR_KPI_CARD_TITLE).toContain("text-al-text-secondary");
    expect(OPERATOR_KPI_CARD_TITLE).toBe(`${OPERATOR_TYPE_SCALE.tab} text-al-text-secondary`);
    expect(OPERATOR_KPI_CARD_DESCRIPTION).toBe(OPERATOR_TYPE_SCALE.helper);
  });

  it("does not expose deprecated OPERATOR_TYPOGRAPHY aliases (TB-538)", () => {
    expect("meta" in OPERATOR_TYPOGRAPHY).toBe(false);
    expect("title" in OPERATOR_TYPE_SCALE).toBe(false);
    expect("section" in OPERATOR_TYPE_SCALE).toBe(false);
    expect("meta" in OPERATOR_TYPE_SCALE).toBe(false);
  });

  it("badge typography uses 11px medium scale for status chips", () => {
    expect(OPERATOR_TYPOGRAPHY.badge).toContain("text-[11px]");
    expect(OPERATOR_TYPOGRAPHY.badge).toContain("font-medium");
  });
});

describe("design-tokens spacing rhythm", () => {
  it("defines canonical major-section and card spacing tokens", () => {
    expect(OPERATOR_LAYOUT.majorSectionGap).toBe("space-y-6");
    expect(OPERATOR_LAYOUT.sectionHeadingStack).toBe("space-y-3");
    expect(OPERATOR_LAYOUT.sectionStack).toBe("space-y-4");
    expect(OPERATOR_CARD.header).toContain("p-4");
    expect(OPERATOR_CARD.content).toContain("pt-0");
    expect(OPERATOR_CARD.body).toBe("p-4");
  });
});
