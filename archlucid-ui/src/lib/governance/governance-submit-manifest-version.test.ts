import { describe, expect, it } from "vitest";

import {
  compareNumericSemverManifestVersions,
  GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
  isNumericSemverManifestVersion,
  resolveDefaultGovernanceSubmitManifestVersion,
  validateGovernanceSubmitManifestVersion,
} from "./governance-submit-manifest-version";

describe("governance-submit-manifest-version", () => {
  it("defaults to 1.0.0 when no persisted max exists", () => {
    expect(resolveDefaultGovernanceSubmitManifestVersion(null)).toBe(
      GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
    );
    expect(resolveDefaultGovernanceSubmitManifestVersion("")).toBe(
      GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
    );
    expect(resolveDefaultGovernanceSubmitManifestVersion("v1.0.0")).toBe(
      GOVERNANCE_SUBMIT_MANIFEST_VERSION_DEFAULT,
    );
  });

  it("defaults to the persisted numeric max when available", () => {
    expect(resolveDefaultGovernanceSubmitManifestVersion("3.4.1")).toBe("3.4.1");
  });

  it("accepts only numeric semver strings", () => {
    expect(isNumericSemverManifestVersion("1.0.0")).toBe(true);
    expect(isNumericSemverManifestVersion("10.20.300")).toBe(true);
    expect(isNumericSemverManifestVersion("v1.0.0")).toBe(false);
    expect(isNumericSemverManifestVersion("1.0")).toBe(false);
    expect(isNumericSemverManifestVersion("alpha")).toBe(false);
  });

  it("compares numeric semver versions", () => {
    expect(compareNumericSemverManifestVersions("1.0.1", "1.0.0")).toBe(1);
    expect(compareNumericSemverManifestVersions("1.0.0", "2.0.0")).toBe(-1);
    expect(compareNumericSemverManifestVersions("2.4.10", "2.4.10")).toBe(0);
  });

  it("rejects versions below the persisted max without another database round trip", () => {
    expect(validateGovernanceSubmitManifestVersion("1.0.0", "3.4.1")).toEqual({
      valid: false,
      message: "Review record version cannot be lower than 3.4.1 for this review.",
    });
  });

  it("accepts versions at or above the persisted max", () => {
    expect(validateGovernanceSubmitManifestVersion("3.4.1", "3.4.1")).toEqual({ valid: true });
    expect(validateGovernanceSubmitManifestVersion("3.4.2", "3.4.1")).toEqual({ valid: true });
  });

  it("rejects non-numeric versions", () => {
    expect(validateGovernanceSubmitManifestVersion("v1.0.0", null)).toEqual({
      valid: false,
      message: "Review record version must use numeric semver (for example 1.0.0).",
    });
  });
});
