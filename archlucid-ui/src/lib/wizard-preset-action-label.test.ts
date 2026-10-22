import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { starterArchitectureTemplates } from "@/data/starter-templates";
import { documentationArchitectureRequestWizardPresets } from "@/lib/docs-architecture-request-presets";
import { verticalBriefWizardPresets } from "@/lib/vertical-wizard-presets";
import { wizardPresets } from "@/lib/wizard-presets";
import {
  formatWizardPresetActionContinuation,
  tokenLooksLikeAcronym,
  wizardPresetActionLabel,
} from "@/lib/wizard-preset-action-label";

describe("wizardPresetActionLabel", () => {
  it("preserves SaaS, EU, US, FedRAMP, and StateRAMP on industry starter CTAs", () => {
    const saas = verticalBriefWizardPresets.find((preset) => preset.id === "vertical-saas");
    const eu = verticalBriefWizardPresets.find((preset) => preset.id === "vertical-public-sector");
    const us = verticalBriefWizardPresets.find((preset) => preset.id === "vertical-public-sector-us");

    expect(saas).toBeDefined();
    expect(eu).toBeDefined();
    expect(us).toBeDefined();

    expect(wizardPresetActionLabel(saas?.label, { starter: true })).toBe("Use SaaS / B2B starter");
    expect(wizardPresetActionLabel(eu?.label, { starter: true })).toBe(
      "Use public sector — EU (GDPR) starter",
    );
    expect(wizardPresetActionLabel(us?.label, { starter: true })).toBe(
      "Use public sector — US (FedRAMP / StateRAMP) starter",
    );
  });

  it("sentence-cases ordinary first words without flattening later acronyms", () => {
    expect(wizardPresetActionLabel("Greenfield SaaS design")).toBe("Use greenfield SaaS design");
    expect(wizardPresetActionLabel("Healthcare", { starter: true })).toBe("Use healthcare starter");
    expect(wizardPresetActionLabel("API platform (B2B)")).toBe("Use API platform (B2B)");
    expect(wizardPresetActionLabel("IoT telemetry ingest")).toBe("Use IoT telemetry ingest");
    expect(wizardPresetActionLabel("AWS microservices review")).toBe("Use AWS microservices review");
  });

  it("keeps quick-shape CTAs sentence-cased for existing wizard tests", () => {
    for (const preset of wizardPresets) {
      expect(wizardPresetActionLabel(preset.label)).toBe(`Use ${preset.label.toLowerCase()}`);
    }
  });

  it("does not flatten acronyms in shipped starter and docs labels", () => {
    const labels = [
      ...verticalBriefWizardPresets,
      ...starterArchitectureTemplates,
      ...documentationArchitectureRequestWizardPresets,
    ].map((preset) => wizardPresetActionLabel(preset.label));

    for (const label of labels) {
      expect(label).not.toMatch(/\bsaas\b/);
      expect(label).not.toMatch(/\beu\b/);
      expect(label).not.toMatch(/\bus\b/);
      expect(label).not.toMatch(/\bfedramp\b/);
      expect(label).not.toMatch(/\bstateramp\b/);
      expect(label).not.toMatch(/\bb2b\b/);
      expect(label).not.toMatch(/\bgdpr\b/);
    }
  });

  it("falls back when the label is missing", () => {
    expect(wizardPresetActionLabel(null)).toBe("Use template");
    expect(wizardPresetActionLabel("   ")).toBe("Use template");
    expect(formatWizardPresetActionContinuation(undefined)).toBe("template");
  });
});

describe("tokenLooksLikeAcronym", () => {
  it("recognizes product acronyms that must keep declared casing", () => {
    expect(tokenLooksLikeAcronym("SaaS")).toBe(true);
    expect(tokenLooksLikeAcronym("B2B")).toBe(true);
    expect(tokenLooksLikeAcronym("EU")).toBe(true);
    expect(tokenLooksLikeAcronym("US")).toBe(true);
    expect(tokenLooksLikeAcronym("FedRAMP")).toBe(true);
    expect(tokenLooksLikeAcronym("StateRAMP")).toBe(true);
    expect(tokenLooksLikeAcronym("GDPR")).toBe(true);
    expect(tokenLooksLikeAcronym("IoT")).toBe(true);
    expect(tokenLooksLikeAcronym("(EU)")).toBe(true);
  });

  it("rejects ordinary heading words", () => {
    expect(tokenLooksLikeAcronym("Public")).toBe(false);
    expect(tokenLooksLikeAcronym("Healthcare")).toBe(false);
    expect(tokenLooksLikeAcronym("Greenfield")).toBe(false);
    expect(tokenLooksLikeAcronym("")).toBe(false);
    expect(tokenLooksLikeAcronym(null)).toBe(false);
  });
});

describe("WizardStepPreset acronym casing guard", () => {
  it("does not flatten preset labels with toLowerCase", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/wizard/steps/WizardStepPreset.tsx"),
      "utf8",
    );

    expect(source).not.toContain("preset.label.toLowerCase()");
    expect(source).toContain("wizardPresetActionLabel(");
  });
});
