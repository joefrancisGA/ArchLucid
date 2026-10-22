import { describe, expect, it } from "vitest";

import {
  buildDiagramReconcileRemediationHref,
  buildDiagramReconcileWorkbenchHref,
  diagramReconcileFilterHrefFromSearch,
  parseDiagramReconcileCloudResourceIdFromSearch,
  parseDiagramReconcileCorrespondenceIdFromSearch,
  parseDiagramReconcileFilterFromSearch,
  parseDiagramReconcileRunIdFromSearch,
  parseDiagramReconcileSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";

describe("infra-evidence-diagram-reconcile-filter-url", () => {
  it("parses run, snapshot, filter, correspondence, and cloud resource params", () => {
    expect(parseDiagramReconcileRunIdFromSearch("run-1")).toBe("run-1");
    expect(parseDiagramReconcileSnapshotIdFromSearch("snap-1")).toBe("snap-1");
    expect(parseDiagramReconcileCloudResourceIdFromSearch("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(parseDiagramReconcileCorrespondenceIdFromSearch("corr-1")).toBe("corr-1");
    expect(parseDiagramReconcileFilterFromSearch(null)).toBe("all");
    expect(parseDiagramReconcileFilterFromSearch("Conflict")).toBe("Conflict");
    expect(parseDiagramReconcileFilterFromSearch("bogus")).toBe("all");
  });

  it("round-trips filter href patches", () => {
    expect(
      diagramReconcileFilterHrefFromSearch("", {
        runId: "run-1",
        snapshotId: "snap-1",
        reconcileFilter: "Conflict",
      }),
    ).toBe("/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1&reconcileFilter=Conflict");

    expect(
      diagramReconcileFilterHrefFromSearch(
        "runId=run-1&snapshotId=snap-1&reconcileFilter=Conflict",
        { reconcileFilter: "all" },
      ),
    ).toBe("/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1");
  });

  it("builds diagram reconcile workbench href with correspondence deep link", () => {
    expect(
      buildDiagramReconcileWorkbenchHref({
        runId: "run-1",
        snapshotId: "snap-1",
        correspondenceId: "corr-1",
      }),
    ).toBe(
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1&correspondenceId=corr-1",
    );
  });

  it("builds scoped diagram reconcile workbench href with cloudResourceId", () => {
    expect(
      buildDiagramReconcileWorkbenchHref({
        runId: "run-1",
        snapshotId: "snap-1",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        correspondenceId: "corr-1",
      }),
    ).toBe(
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=snap-1&cloudResourceId=11111111-1111-1111-1111-111111111111&correspondenceId=corr-1",
    );
  });

  it("builds remediation factory handoff links for conflict correspondence rows", () => {
    expect(
      buildDiagramReconcileRemediationHref({
        row: {
          correspondenceId: "corr-1",
          diagramNodeId: "node-1",
          diagramNodeLabel: "gateway",
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gateway",
          resourceType: "Microsoft.Network/publicIPAddresses",
          resourceGroup: "rg",
          terraformAddress: null,
          matchKind: "Conflict",
          confidenceBand: "Likely",
          explainText: "Multiple inventory resources matched the diagram node.",
          aiRationale: null,
          securityDiscrepancy: true,
        },
        runId: "run-1",
        snapshotId: "snap-1",
        findingId: "finding-1",
      }),
    ).toBe(
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1&correspondenceId=corr-1&runId=run-1&snapshotId=snap-1",
    );

    expect(
      buildDiagramReconcileRemediationHref({
        row: {
          correspondenceId: "infra-only-1",
          diagramNodeId: null,
          diagramNodeLabel: null,
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/orphan",
          resourceType: "Microsoft.Storage/storageAccounts",
          resourceGroup: "rg",
          terraformAddress: null,
          matchKind: "InfrastructureOnly",
          confidenceBand: "InsufficientEvidence",
          explainText: "Inventory resource has no corresponding diagram node.",
          aiRationale: null,
          securityDiscrepancy: false,
        },
        runId: "run-1",
        snapshotId: "snap-1",
      }),
    ).toBeNull();
  });
});
