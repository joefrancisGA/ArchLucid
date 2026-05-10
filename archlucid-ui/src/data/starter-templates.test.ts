import { describe, expect, it } from "vitest";

import { applyWizardPreset } from "@/lib/wizard-presets";
import { buildDefaultWizardValues, wizardFormSchema } from "@/lib/wizard-schema";

import { starterArchitectureTemplates } from "./starter-templates";

describe("starterArchitectureTemplates", () => {
  it("has unique ids and parses through the wizard schema", () => {
    const ids = new Set<string>();

    expect(starterArchitectureTemplates.length).toBeGreaterThanOrEqual(4);

    for (const t of starterArchitectureTemplates) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);

      wizardFormSchema.parse(applyWizardPreset(buildDefaultWizardValues(), t.values));
    }
  });
});
