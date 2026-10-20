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
    expect(presentation.detail).toContain("values are discarded");
    expect(presentation.detail).not.toContain("never values");
  });

  it("maps app settings list forbidden warnings", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "app-settings-list-forbidden:/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app",
    );

    expect(presentation.title).toContain("could not be listed");
    expect(presentation.detail).toContain("microsoft.web/sites/config/list/action");
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

  it("maps AKS insufficient-rbac warnings with remediation copy", () => {
    const clusterId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-maks";
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      `aks-workload-images-not-collected-customer-script:insufficient-rbac:${clusterId}`,
    );

    expect(presentation.title).toContain("insufficient permission");
    expect(presentation.detail).toContain("runCommand");
    expect(presentation.detail).toContain("aks-maks");
    expect(presentation.detail).toContain("Pulls image from");
  });

  it("maps legacy AKS workload image warning codes", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "aks-workload-images-not-collected-customer-script",
    );

    expect(presentation.title).toContain("AKS workload images not collected");
    expect(presentation.detail).toContain("CustomerScript");
  });

  it("maps Logic App connection collection permission warnings", () => {
    const workflowId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/la1";
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      `logic-app-connections-not-collected:insufficient-permission:${workflowId}`,
    );

    expect(presentation.title).toContain("Logic App");
    expect(presentation.detail).toContain("la1");
    expect(presentation.detail).toContain("workflows/read");
  });

  it("maps Fabric capacity assignment warnings", () => {
    const capacityId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/capacities/cap1";
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      `fabric-capacity-assignments-not-collected:insufficient-permission:${capacityId}`,
    );

    expect(presentation.title).toContain("Fabric");
    expect(presentation.detail).toContain("cap1");
    expect(presentation.detail).toContain("Hosts");
  });

  it("maps logic-app-connections-missing without raw code fallback (P-07)", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "logic-app-connections-missing",
    );

    expect(presentation.title).toBe("Logic App API connections were not in this snapshot.");
    expect(presentation.detail).toContain("logic-app-connections.json");
    expect(presentation.detail).not.toBe("logic-app-connections-missing");
  });

  it("maps diagnostic-destination-unresolved without raw code fallback (P-08)", () => {
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      "diagnostic-destination-unresolved",
    );

    expect(presentation.title).toContain("diagnostic setting destination");
    expect(presentation.detail).toBe("No diagnostic line was drawn for that destination.");
  });

  it("maps static site backend collection warnings", () => {
    const siteId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/staticSites/site1";
    const presentation = resolveInfraEvidenceCompletenessWarningPresentation(
      `static-site-backends-not-collected:http-error:${siteId}`,
    );

    expect(presentation.title).toContain("Static Web App");
    expect(presentation.detail).toContain("site1");
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
