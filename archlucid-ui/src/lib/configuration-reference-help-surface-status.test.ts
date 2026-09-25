import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_STATUS_FAILED,
  CONFIGURATION_REFERENCE_HELP_STATUS_GATED,
  CONFIGURATION_REFERENCE_HELP_STATUS_PENDING,
  resolveConfigurationReferenceConfigurationSummarySurfaceStatus,
  resolveConfigurationReferenceIdentityProvidersSurfaceStatus,
  resolveConfigurationReferenceSsoSurfaceStatus,
} from "@/lib/configuration-reference-help-surface-status";

describe("configuration-reference-help-surface-status", () => {
  it("returns pending while identity data is loading", () => {
    expect(
      resolveConfigurationReferenceSsoSurfaceStatus({
        identity: null,
        identityPending: true,
        identityLoadFailed: false,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING,
    });
    expect(
      resolveConfigurationReferenceIdentityProvidersSurfaceStatus({
        identity: null,
        identityPending: true,
        identityLoadFailed: false,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING,
    });
  });

  it("returns failed when identity data is unavailable", () => {
    expect(
      resolveConfigurationReferenceSsoSurfaceStatus({
        identity: null,
        identityPending: false,
        identityLoadFailed: true,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_FAILED,
    });
    expect(
      resolveConfigurationReferenceIdentityProvidersSurfaceStatus({
        identity: null,
        identityPending: false,
        identityLoadFailed: true,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_FAILED,
    });
  });

  it("returns gated for configuration summary outside internal shell", () => {
    expect(
      resolveConfigurationReferenceConfigurationSummarySurfaceStatus({
        includeHostConfigurationLint: false,
        configLintPending: false,
        configLintAvailable: false,
        configLintLoadFailed: false,
        configLintBlockingCount: null,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_GATED,
    });
  });

  it("returns pending for configuration summary while lint is loading", () => {
    expect(
      resolveConfigurationReferenceConfigurationSummarySurfaceStatus({
        includeHostConfigurationLint: true,
        configLintPending: true,
        configLintAvailable: false,
        configLintLoadFailed: false,
        configLintBlockingCount: null,
      }),
    ).toEqual({
      kind: "neutral",
      label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING,
    });
  });

  it("maps zero blocking lint findings to ready", () => {
    expect(
      resolveConfigurationReferenceConfigurationSummarySurfaceStatus({
        includeHostConfigurationLint: true,
        configLintPending: false,
        configLintAvailable: true,
        configLintLoadFailed: false,
        configLintBlockingCount: 0,
      }),
    ).toEqual({
      kind: "ready",
      label: "Ready",
    });
  });
});
