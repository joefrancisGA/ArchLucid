import { describe, expect, it } from "vitest";

import {
  parseWizardPresetDeeplinkToken,
  resolveWizardPresetIdFromDeeplink,
  resolveWizardPresetDeeplinkTokenFromPresetId,
  resolveWizardPresetValuesFromDeeplink,
} from "@/lib/wizard-preset-deeplink";

describe("wizard-preset-deeplink", () => {
  it("maps known preset tokens to wizard preset ids", () => {
    expect(parseWizardPresetDeeplinkToken("greenfield")).toBe("greenfield");
    expect(resolveWizardPresetIdFromDeeplink("modernize")).toBe("modernize-legacy");
    expect(resolveWizardPresetIdFromDeeplink("blank")).toBe("blank-advanced");
  });

  it("returns null for missing or unknown tokens", () => {
    expect(parseWizardPresetDeeplinkToken(null)).toBeNull();
    expect(parseWizardPresetDeeplinkToken("")).toBeNull();
    expect(parseWizardPresetDeeplinkToken("legacy")).toBeNull();
    expect(resolveWizardPresetValuesFromDeeplink("unknown")).toBeNull();
  });

  it("returns greenfield preset values for greenfield token", () => {
    const values = resolveWizardPresetValuesFromDeeplink("greenfield");

    expect(values).not.toBeNull();
    expect(values?.systemName).toBe("CustomerWebApp");
  });

  it("maps preset ids back to deeplink tokens", () => {
    expect(resolveWizardPresetDeeplinkTokenFromPresetId("greenfield-web-app")).toBe("greenfield");
    expect(resolveWizardPresetDeeplinkTokenFromPresetId("event-driven-integration")).toBeNull();
  });
});
