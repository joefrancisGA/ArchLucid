import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "PolicyPacksPageView.tsx"),
  "utf8",
);

describe("PolicyPacksPageView progressive disclosure", () => {
  it("limits primary nav to My packs and Catalog tabs", () => {
    expect(source).toContain('data-testid="policy-packs-tab-my-packs"');
    expect(source).toContain('data-testid="policy-packs-tab-catalog"');
    expect(source).toContain('data-testid="policy-packs-surface-tabs"');
    expect(source).toContain("<TabsList");
    expect(source).not.toContain('data-testid="policy-packs-tab-author"');
    expect(source).not.toContain('data-testid="policy-packs-tab-generator"');
  });

  it("surfaces policy impact preview outside the advanced accordion", () => {
    expect(source).toContain("PolicyPackImpactPreviewPanel");
    expect(source.indexOf("PolicyPackImpactPreviewPanel")).toBeLessThan(
      source.indexOf('data-testid="policy-packs-advanced-options"'),
    );
  });

  it("folds inspect JSON and impact simulation into default-closed accordion", () => {
    expect(source).toContain('data-testid="policy-packs-advanced-options"');
    expect(source).toContain("PolicyPackImpactSimulationCard");
    expect(source).toContain("Inspect tools and JSON lifecycle");
  });

  it("moves authoring and generator into dedicated advanced panel", () => {
    const authoringSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "PolicyPacksAdvancedAuthoringPanel.tsx"),
      "utf8",
    );

    expect(source).toContain("PolicyPacksAdvancedAuthoringPanel");
    expect(authoringSource).toContain('data-testid="policy-packs-advanced-authoring"');
  });
});
