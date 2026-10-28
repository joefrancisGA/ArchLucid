import { describe, expect, it } from "vitest";

import {
  applyWizardPreset,
  resolveWizardPresetLabel,
  wizardFormFieldMatchesPreset,
  wizardPresets,
} from "@/lib/wizard-presets";
import { buildDefaultWizardValues } from "@/lib/wizard-schema";

const architectureDomainAdmissionRegex =
  /\b(architecture|system|database|apis?|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b/i;

describe("wizard-presets — TB-644 cloud-neutral defaults", () => {
  it("admits the greenfield starter description through the create-run safety precheck", () => {
    const greenfield = wizardPresets.find((entry) => entry.id === "greenfield-web-app");

    expect(greenfield?.values.description).toBeDefined();
    expect(architectureDomainAdmissionRegex.test(greenfield!.values.description ?? "")).toBe(true);
  });

  it("named starter presets include a lifecycle environment so step-0 Next can pass", () => {
    const allowedEnvironments: readonly string[] = ["staging", "production", "development", "sandbox"];

    for (const preset of wizardPresets) {

      if (preset.id === "blank-advanced") {
        continue;
      }

      const merged = applyWizardPreset(buildDefaultWizardValues(), preset.values);

      expect(merged.environment.length, preset.id).toBeGreaterThan(0);
      expect(allowedEnvironments, preset.id).toContain(merged.environment);
    }
  });

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

  it("resolveWizardPresetLabel uses not-stored copy for unknown ids", () => {
    expect(resolveWizardPresetLabel("missing-preset")).toBe("Starter preset label was not stored.");
    expect(resolveWizardPresetLabel("")).toBe("Starter preset was not stored yet.");
  });

  it("matches a live form field against the selected starter preset", () => {
    const greenfield = wizardPresets.find((entry) => entry.id === "greenfield-web-app");

    expect(greenfield).toBeDefined();

    if (greenfield === undefined) {
      return;
    }

    const formValues = applyWizardPreset(buildDefaultWizardValues(), greenfield.values);

    expect(wizardFormFieldMatchesPreset("greenfield-web-app", "systemName", formValues)).toBe(true);
    expect(
      wizardFormFieldMatchesPreset("greenfield-web-app", "systemName", {
        ...formValues,
        systemName: "TypedByOperator",
      }),
    ).toBe(false);
  });
});
