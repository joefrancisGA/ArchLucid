import { wizardPresets } from "@/lib/wizard-presets";
import type { WizardFormValues } from "@/lib/wizard-schema";

export const WIZARD_PRESET_DEEPLINK_QUERY_KEY = "preset";

export type WizardPresetDeeplinkToken = "greenfield" | "modernize" | "blank";

const DEEPLINK_TO_WIZARD_PRESET_ID: Record<WizardPresetDeeplinkToken, string> = {
  greenfield: "greenfield-web-app",
  modernize: "modernize-legacy",
  blank: "blank-advanced",
};

export function parseWizardPresetDeeplinkToken(raw: string | null | undefined): WizardPresetDeeplinkToken | null {
  const normalized = raw?.trim().toLowerCase();

  if (normalized === "greenfield" || normalized === "modernize" || normalized === "blank") {
    return normalized;
  }

  return null;
}

export function resolveWizardPresetIdFromDeeplink(raw: string | null | undefined): string | null {
  const token = parseWizardPresetDeeplinkToken(raw);

  if (token === null) {
    return null;
  }

  return DEEPLINK_TO_WIZARD_PRESET_ID[token];
}

export function resolveWizardPresetValuesFromDeeplink(
  raw: string | null | undefined,
): Partial<WizardFormValues> | null {
  const presetId = resolveWizardPresetIdFromDeeplink(raw);

  if (presetId === null) {
    return null;
  }

  const preset = wizardPresets.find((entry) => entry.id === presetId);

  if (preset === undefined) {
    return null;
  }

  return preset.values;
}
