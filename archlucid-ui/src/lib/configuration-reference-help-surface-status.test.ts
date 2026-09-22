import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED,
  resolveConfigurationReferenceConfigurationSummarySurfaceStatus,
  resolveConfigurationReferenceIdentityProvidersSurfaceStatus,
  resolveConfigurationReferenceSsoSurfaceStatus,
} from "@/lib/configuration-reference-help-surface-status";

describe("configuration-reference-help-surface-status", () => {
  it("returns not-loaded when identity data is unavailable", () => {
    expect(resolveConfigurationReferenceSsoSurfaceStatus(null, true)).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED,
    });
    expect(resolveConfigurationReferenceIdentityProvidersSurfaceStatus(null, true)).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED,
    });
  });

  it("returns not-loaded for configuration summary when lint is unavailable", () => {
    expect(resolveConfigurationReferenceConfigurationSummarySurfaceStatus(false, null)).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED,
    });
  });

  it("maps zero blocking lint findings to ready", () => {
    expect(resolveConfigurationReferenceConfigurationSummarySurfaceStatus(true, 0)).toEqual({
      kind: "ready",
      label: "Ready",
    });
  });
});
