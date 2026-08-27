import { describe, expect, it } from "vitest";

import {
  AL_CSS_VAR_NAMES,
  DESIGN_TOKENS,
  enterpriseStatusTagClass,
  FINDINGS_ROW_METADATA_TAG_SIZE,
  METADATA_STATUS_TAG_SHELL,
  OPERATOR_CARD,
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_LAYOUT,
  OPERATOR_PRIMARY_FILL_USAGE_CONTRACT,
  OPERATOR_RESUME,
  OPERATOR_SELECTION,
  OPERATOR_TYPE_SCALE,
  OPERATOR_TYPOGRAPHY,
  operatorConfidenceSurface,
  operatorSemanticBadge,
  operatorSemanticSurface,
} from "@/lib/design-tokens";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("findings-row tag size steps to 12px without arbitrary sizing", () => {
    expect(FINDINGS_ROW_METADATA_TAG_SIZE).toContain("text-xs");
    expect(FINDINGS_ROW_METADATA_TAG_SIZE).not.toContain("text-sm");
    expect(FINDINGS_ROW_METADATA_TAG_SIZE).not.toContain("text-[");
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

  it("interactive filter chips use button label scale (TB-2290)", () => {
    expect(DESIGN_TOKENS.interactive.chip).toContain("text-[13px]");
    expect(DESIGN_TOKENS.interactive.chip).toContain("font-semibold");
    expect(DESIGN_TOKENS.interactive.chip).not.toContain("text-[11px]");
  });

  it("native control label alias matches button scale", () => {
    expect(OPERATOR_TYPOGRAPHY.nativeControlLabel).toBe(OPERATOR_TYPOGRAPHY.button);
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

describe("design-tokens TB-2276–TB-2280 color hierarchy", () => {
  const globalsCss = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  it("TB-2276 desaturates inline link teal below primary action fill", () => {
    expect(globalsCss).toMatch(/--al-accent-link:\s*#1e4e4a;/);
    expect(globalsCss).toMatch(/--al-primary-action-bg:\s*#0f766e;/);
    expect(globalsCss).toMatch(/--al-accent-link-hover:\s*#134e4a;/);
    expect(globalsCss).toMatch(/\.dark\s*\{[\s\S]*--al-accent-link:\s*#14b8a6;/);
    expect(globalsCss).toMatch(/\.dark\s*\{[\s\S]*--al-primary-action-bg:\s*#115e59;/);
  });

  it("keeps anchor inherit color in @layer base so primary Button asChild links stay white on teal", () => {
    expect(globalsCss).toMatch(/@layer base\s*\{[\s\S]*a\s*\{[\s\S]*color:\s*inherit;/);
    expect(globalsCss).not.toMatch(/\n\s*a\s*\{\s*\n\s*color:\s*inherit;\s*\n\s*\}\s*\n\s*\/\*/);
  });

  it("TB-2277 registers dedicated neutral status CSS variables", () => {
    expect(AL_CSS_VAR_NAMES.statusNeutralBg).toBe("--al-status-neutral-bg");
    expect(AL_CSS_VAR_NAMES.statusNeutralFg).toBe("--al-status-neutral-fg");
    expect(AL_CSS_VAR_NAMES.statusNeutralBorder).toBe("--al-status-neutral-border");
    expect(globalsCss).toContain("--al-status-neutral-bg:");
    expect(globalsCss).toContain("--al-status-neutral-fg:");
    expect(globalsCss).toContain("--al-status-neutral-border:");
    expect(enterpriseStatusTagClass("neutral")).toContain("var(--al-status-neutral-bg)");
    expect(enterpriseStatusTagClass("neutral")).not.toContain("bg-neutral-100");
  });

  it("TB-2278 micro-shifts base canvas away from raised white", () => {
    expect(globalsCss).toMatch(/--al-surface-base:\s*#ececed;/);
  });

  it("TB-2279 documents primary-fill usage contract in design tokens and UI_DESIGN_SYSTEM", () => {
    expect(OPERATOR_PRIMARY_FILL_USAGE_CONTRACT.filledPrimary).toContain("forward");
    expect(OPERATOR_PRIMARY_FILL_USAGE_CONTRACT.navigationOpens).toContain("outline");

    const designSystem = readFileSync(
      join(process.cwd(), "..", "docs", "library", "UI_DESIGN_SYSTEM.md"),
      "utf8",
    );

    expect(designSystem).toContain("Primary action color usage (**TB-2279**");
    expect(designSystem).toContain("OPERATOR_PRIMARY_FILL_USAGE_CONTRACT");
  });

  it("TB-2280 keeps Approved with monitoring visually distinct from Ready", () => {
    const ready = enterpriseStatusTagClass("ready");
    const monitoring = enterpriseStatusTagClass("approved-with-monitoring");

    expect(ready).toContain("--al-status-ready-bg");
    expect(monitoring).toContain("--al-status-approved-monitoring-bg");
    expect(monitoring).not.toContain("--al-status-ready-bg");
    expect(monitoring).toContain("border-l-cyan-800");
    expect(ready).toContain("border-l-emerald-600");
    expect(globalsCss).toMatch(/--al-status-approved-monitoring-bg:\s*#e6f4f3;/);
    expect(globalsCss).toMatch(/--al-status-approved-monitoring-fg:\s*#0f4c5c;/);
  });

  it("TB-2092 neutralizes operator resume strips and selection tiles without pastel teal", () => {
    expect(OPERATOR_CARD.lifecycleEmphasized).toContain("border-l-neutral-700");
    expect(OPERATOR_CARD.lifecycleEmphasized).not.toContain("teal");

    expect(OPERATOR_RESUME.strip).toContain("border-neutral-200");
    expect(OPERATOR_RESUME.strip).not.toMatch(/teal/);
    expect(OPERATOR_RESUME.stripSpaced).toContain("mb-4");
    expect(OPERATOR_RESUME.stripCelebrate).toContain("mb-3");

    expect(OPERATOR_SELECTION.tile).toContain("border-neutral-500");
    expect(OPERATOR_SELECTION.tile).not.toMatch(/teal/);
    expect(OPERATOR_SELECTION.row).toContain("bg-al-surface-raised");
  });
});
