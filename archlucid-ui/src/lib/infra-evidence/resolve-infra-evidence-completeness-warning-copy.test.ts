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

  it("explains a counted unmapped role warning", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "rbac-role-unmapped:2:/providers/Microsoft.Authorization/roleDefinitions/role-1::Contoso Reader",
    );

    expect(presentation.title).toBe("Role not translated into a data-plane line");
    expect(presentation.detail).toContain("Contoso Reader is assigned 2 times.");
    expect(presentation.detail).toContain("Has role is recorded.");
    expect(presentation.detail).toContain("No can-read or can-write line was drawn.");
  });

  it("preserves legacy unmapped role warnings", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "rbac-role-unmapped:/providers/Microsoft.Authorization/roleDefinitions/role-1",
    );

    expect(presentation.detail).toContain("assigned at least once");
    expect(presentation.detail).toContain("Role definition /providers/Microsoft.Authorization/roleDefinitions/role-1.");
  });

  it("falls back when an unmapped role count is malformed", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "rbac-role-unmapped:not-a-count:/providers/Microsoft.Authorization/roleDefinitions/role-1",
    );

    expect(presentation.detail).toContain("assigned at least once");
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
