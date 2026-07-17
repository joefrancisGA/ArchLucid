import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

const pageViewSource = readFileSync(join(sectionsDir, "PolicyPacksPageView.tsx"), "utf8");
const advancedAuthoringSource = readFileSync(join(sectionsDir, "PolicyPacksAdvancedAuthoringPanel.tsx"), "utf8");
const authoringTabSource = readFileSync(join(sectionsDir, "PolicyPacksAuthoringTabSection.tsx"), "utf8");
const generatorSectionSource = readFileSync(join(sectionsDir, "PolicyPackGeneratorSection.tsx"), "utf8");
const wizardSource = readFileSync(join(sectionsDir, "PolicyRuleAuthoringWizard.tsx"), "utf8");
const deferredChunksSource = readFileSync(join(sectionsDir, "policy-packs-authoring-deferred-chunks.tsx"), "utf8");

const bannedStaticImports = [
  './PolicyRuleAuthoringWizard"',
  './PolicyPackNaturalLanguageBuilder"',
  './PolicyPackVisualBuilder"',
] as const;

describe("policy packs bundle deferred imports (TB-698)", () => {
  it("keeps authoring-only modules off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
      expect(advancedAuthoringSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("PolicyPacksAdvancedAuthoringPanel");
  });

  it("routes authoring tab and generator through deferred chunk wrappers", () => {
    expect(authoringTabSource).toContain("PolicyRuleAuthoringWizardDeferred");
    expect(authoringTabSource).not.toContain('from "./PolicyRuleAuthoringWizard"');

    expect(generatorSectionSource).toContain("PolicyPackNaturalLanguageBuilderDeferred");
    expect(generatorSectionSource).not.toContain('from "./PolicyPackNaturalLanguageBuilder"');

    expect(wizardSource).toContain("PolicyPackNaturalLanguageBuilderDeferred");
    expect(wizardSource).toContain("PolicyPackVisualBuilderDeferred");
    expect(wizardSource).not.toContain('from "./PolicyPackNaturalLanguageBuilder"');
    expect(wizardSource).not.toContain('from "./PolicyPackVisualBuilder"');
  });

  it("dynamic-imports all three authoring surfaces", () => {
    expect(deferredChunksSource).toContain('import("./PolicyRuleAuthoringWizard")');
    expect(deferredChunksSource).toContain('import("./PolicyPackNaturalLanguageBuilder")');
    expect(deferredChunksSource).toContain('import("./PolicyPackVisualBuilder")');
    expect(deferredChunksSource).toContain("ssr: false");
  });
});
