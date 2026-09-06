import { describe, expect, it } from "vitest";

import { buildAdvisoryTerraformResourceSnippet } from "@/lib/infra-evidence/build-advisory-terraform-resource-snippet";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildScopedHubDriftChangeWorkbenchHref,
  buildScopedInfraWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-scoped-workbench-href";

const auditContext = {
  assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
};

const AUDIT_SUFFIX =
  "&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("infra-evidence-scoped-workbench-href", () => {
  it("forwards audit params on drift, remediation, and terraform workbench links", () => {
    expect(
      buildScopedInfraWorkbenchHref(
        "drift",
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          snapshotId: "22222222-2222-2222-2222-222222222222",
        },
        auditContext,
      ),
    ).toBe(
      `/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111${AUDIT_SUFFIX}`,
    );

    expect(
      buildScopedInfraWorkbenchHref(
        "remediation",
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          findingId: "finding-1",
        },
        auditContext,
      ),
    ).toBe(
      `/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1${AUDIT_SUFFIX}`,
    );

    expect(
      buildScopedInfraWorkbenchHref(
        "terraform",
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          snapshotId: "22222222-2222-2222-2222-222222222222",
        },
        auditContext,
      ),
    ).toBe(
      `/governance/infrastructure/terraform?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111${AUDIT_SUFFIX}`,
    );
  });

  it("forwards audit params on hub drift change deep links", () => {
    expect(
      buildScopedHubDriftChangeWorkbenchHref(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
        {
          changeId: "change-1",
          diffId: "diff-1",
          snapshotAId: "22222222-2222-2222-2222-222222222222",
          snapshotBId: "33333333-3333-3333-3333-333333333333",
          property: "sku",
          changeType: "Modified",
          oldValue: "Basic",
          newValue: "Standard",
          riskClassification: "Medium",
        },
        auditContext,
      ),
    ).toBe(
      `/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&changeId=change-1&diffId=diff-1${AUDIT_SUFFIX}`,
    );
  });
});

describe("build-advisory-terraform-resource-snippet", () => {
  it("builds an advisory HCL stub when terraform address is present", () => {
    const hub = {
      terraformAddress: "azurerm_public_ip.gateway",
      terraformGenerationMethod: "advisory",
      externalResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      currentConfiguration: {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        azureResourceId:
          "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
        resourceType: "Microsoft.Network/publicIPAddresses",
        resourceGroup: "rg-net",
        region: "eastus",
        properties: {},
        tags: {},
      },
    } as CloudResourceEvidenceHubResponse;

    expect(buildAdvisoryTerraformResourceSnippet(hub)).toContain('resource "azurerm_public_ip" "gateway"');
  });

  it("returns null when terraform address is missing", () => {
    const hub = {
      terraformAddress: null,
      externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
    } as CloudResourceEvidenceHubResponse;

    expect(buildAdvisoryTerraformResourceSnippet(hub)).toBeNull();
  });
});
