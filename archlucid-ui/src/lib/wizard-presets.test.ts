import { describe, expect, it } from "vitest";

import { applyWizardPreset, wizardPresets } from "@/lib/wizard-presets";
import { buildDefaultWizardValues } from "@/lib/wizard-schema";

describe("wizard-presets — TB-644 cloud-neutral defaults", () => {
  it("does not pre-select Azure cloudProvider on starter presets", () => {
    const azurePresetIds = ["greenfield-web-app", "event-driven-integration", "data-lake-analytics"];

    for (const presetId of azurePresetIds) {
      const preset = wizardPresets.find((entry) => entry.id === presetId);

      expect(preset, presetId).toBeDefined();
      expect(preset?.values.cloudProvider).toBeUndefined();

      const merged = applyWizardPreset(buildDefaultWizardValues(), preset!.values);

      expect(merged.cloudProvider).toBe("None");
    }
  });
});
