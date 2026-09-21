import { describe, expect, it } from "vitest";

import {
  resolveInfraEvidenceCompletenessWarningPresentation,
  snapshotIncludesTier1AppSettingHosts,
} from "@/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy";

describe("resolveInfraEvidenceCompletenessWarningPresentation", () => {
  it("maps hosted app-settings gap copy", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "app-settings-not-collected-hosted-get-only",
    );

    expect(presentation.code).toBe("app-settings-not-collected-hosted-get-only");
    expect(presentation.title).toContain("hosted pull");
  });

  it("maps broad RBAC scope warnings", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "rbac-scope-too-broad:/subscriptions/sub",
    );

    expect(presentation.code).toBe("rbac-scope-too-broad:/subscriptions/sub");
    expect(presentation.detail).toContain("/subscriptions/sub");
  });
});

describe("snapshotIncludesTier1AppSettingHosts", () => {
  it("returns false when hosted gap warning is present", () => {
    expect(
      snapshotIncludesTier1AppSettingHosts(["app-settings-not-collected-hosted-get-only"]),
    ).toBe(false);
  });

  it("returns true when hosted gap warning is absent", () => {
    expect(snapshotIncludesTier1AppSettingHosts(["rbac-scope-too-broad:/subscriptions/sub"])).toBe(true);
  });
});
