import { describe, expect, it } from "vitest";

import { isAppShellWorkspaceFooterBuildFingerprintVisible } from "@/lib/app-shell-workspace-footer-build-fingerprint-visibility";

describe("isAppShellWorkspaceFooterBuildFingerprintVisible", () => {
  it("shows build fingerprint footer on SecureNow drift route", () => {
    expect(isAppShellWorkspaceFooterBuildFingerprintVisible("/infrastructure/drift")).toBe(true);
  });

  it("hides build fingerprint footer on governance infrastructure routes", () => {
    expect(isAppShellWorkspaceFooterBuildFingerprintVisible("/governance/infrastructure/drift")).toBe(false);
  });
});
