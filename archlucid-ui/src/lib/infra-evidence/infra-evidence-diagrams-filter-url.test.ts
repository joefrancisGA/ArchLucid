import { describe, expect, it } from "vitest";

import {
  INFRA_DIAGRAMS_DEFAULT_MODE,
  buildDiagramsWorkbenchHref,
  infraDiagramsFilterHrefFromSearch,
  parseInfraDiagramsCloudResourceIdFromSearch,
  parseInfraDiagramsIncludePrivateEndpointsFromSearch,
  parseInfraDiagramsIncludeRecoveryServicesFromSearch,
  parseInfraDiagramsIncludeCrossGroupFanOutFromSearch,
  INFRA_DIAGRAMS_INCLUDE_CROSS_GROUP_FAN_OUT_PARAM,
  INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM,
  parseInfraDiagramsMermaidModeFromSearch,
  parseInfraDiagramsMermaidViewFromSearch,
  parseInfraDiagramsSeedNodeIdFromSearch,
  parseInfraDiagramsSnapshotIdFromSearch,
  parseInfraDiagramsSubscriptionFilterFromSearch,
  resolveInfraDiagramsSelectedSnapshotId,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";

describe("infra-evidence-diagrams-filter-url", () => {
  it("parses snapshot, mode, view, seed node, and cloud resource params", () => {
    expect(parseInfraDiagramsSnapshotIdFromSearch("abc")).toBe("abc");
    expect(parseInfraDiagramsCloudResourceIdFromSearch("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(parseInfraDiagramsMermaidModeFromSearch(null)).toBe("");
    expect(parseInfraDiagramsMermaidModeFromSearch("network")).toBe("network");
    expect(parseInfraDiagramsMermaidModeFromSearch("dataFlow")).toBe("dataFlow");
    expect(parseInfraDiagramsMermaidModeFromSearch("dataArchitecture")).toBe("dataArchitecture");
    expect(parseInfraDiagramsMermaidModeFromSearch("resourceGroup")).toBe("resourceGroup");
    expect(parseInfraDiagramsMermaidModeFromSearch("dependencyNeighborhood")).toBe("dependencyNeighborhood");
    expect(parseInfraDiagramsMermaidModeFromSearch("bogus")).toBe("");
    expect(parseInfraDiagramsMermaidViewFromSearch("executive")).toBe("executive");
    expect(parseInfraDiagramsSeedNodeIdFromSearch("/subscriptions/x")).toBe("/subscriptions/x");
  });

  it("round-trips filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        mermaidMode: "network",
        mermaidView: "executive",
        seedNodeId: "node-1",
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=network&mermaidView=executive&seedNodeId=node-1");

    expect(
      infraDiagramsFilterHrefFromSearch(
        "snapshotId=snap-1&mermaidMode=network&mermaidView=executive&seedNodeId=node-1",
        {
          mermaidMode: "",
          mermaidView: "",
          seedNodeId: "",
        },
      ),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1");

    expect(
      infraDiagramsFilterHrefFromSearch("snapshotId=snap-1", {
        mermaidMode: INFRA_DIAGRAMS_DEFAULT_MODE,
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=executive");
  });

  it("builds scoped diagrams workbench href with cloudResourceId", () => {
    expect(
      buildDiagramsWorkbenchHref({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
      }),
    ).toBe(
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("round-trips audit scope in diagrams filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      }),
    ).toBe(
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("round-trips resource group picker mode in filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        mermaidMode: "resourceGroup",
        mermaidView: "rg-net",
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=resourceGroup&mermaidView=rg-net");
  });

  it("round-trips dependency neighborhood mode in filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        mermaidMode: "dependencyNeighborhood",
        seedNodeId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
      }),
    ).toBe(
      "/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=dependencyNeighborhood&seedNodeId=%2Fsubscriptions%2Fsub%2FresourceGroups%2Frg%2Fproviders%2FMicrosoft.Network%2FpublicIPAddresses%2Fgw",
    );
  });

  it("round-trips hidden Executive tier keys in filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        hiddenExecutiveTierKeys: ["storage", "integration"],
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&hideTiers=integration%2Cstorage");

    expect(
      infraDiagramsFilterHrefFromSearch("snapshotId=snap-1&hideTiers=storage", {
        hiddenExecutiveTierKeys: [],
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1");
  });

  it("does not auto-select the first catalog snapshot when the URL has none", () => {
    const snapshots = [{ snapshotId: "snap-1" }, { snapshotId: "snap-2" }];

    expect(resolveInfraDiagramsSelectedSnapshotId("", snapshots)).toBe("");
    expect(resolveInfraDiagramsSelectedSnapshotId("   ", snapshots)).toBe("");
  });

  it("honors a deep-linked snapshot only when it is in the catalog", () => {
    const snapshots = [{ snapshotId: "snap-1" }, { snapshotId: "snap-2" }];

    expect(resolveInfraDiagramsSelectedSnapshotId("snap-2", snapshots)).toBe("snap-2");
    expect(resolveInfraDiagramsSelectedSnapshotId("missing", snapshots)).toBe("");
  });

  it("parses subscription filter and private endpoint params", () => {
    expect(parseInfraDiagramsSubscriptionFilterFromSearch("sub-prod")).toBe("sub-prod");
    expect(parseInfraDiagramsSubscriptionFilterFromSearch(null)).toBe("");
    expect(parseInfraDiagramsIncludePrivateEndpointsFromSearch("1")).toBe(true);
    expect(parseInfraDiagramsIncludePrivateEndpointsFromSearch("true")).toBe(true);
    expect(parseInfraDiagramsIncludePrivateEndpointsFromSearch(null)).toBe(false);
    expect(parseInfraDiagramsIncludeRecoveryServicesFromSearch("1")).toBe(true);
    expect(parseInfraDiagramsIncludeRecoveryServicesFromSearch(null)).toBe(false);
    expect(parseInfraDiagramsIncludeCrossGroupFanOutFromSearch("1")).toBe(true);
    expect(parseInfraDiagramsIncludeCrossGroupFanOutFromSearch(null)).toBe(false);
  });

  it("round-trips includeRecoveryServices without touching includeNeverShow", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("includeNeverShow=1", {
        includeRecoveryServices: true,
      }),
    ).toBe(
      `/governance/infrastructure/diagrams?includeNeverShow=1&${INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM}=1`,
    );

    expect(
      infraDiagramsFilterHrefFromSearch(
        `includeNeverShow=1&${INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM}=1`,
        {
          includeRecoveryServices: false,
        },
      ),
    ).toBe("/governance/infrastructure/diagrams?includeNeverShow=1");
  });

  it("round-trips subscription filter and private endpoint patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        subscriptionFilter: "sub-prod",
        includePrivateEndpoints: true,
      }),
    ).toBe(
      "/governance/infrastructure/diagrams?snapshotId=snap-1&diagramSubscription=sub-prod&includePrivateEndpoints=1",
    );

    expect(
      infraDiagramsFilterHrefFromSearch(
        "snapshotId=snap-1&diagramSubscription=sub-prod&includePrivateEndpoints=1",
        {
          subscriptionFilter: "",
          includePrivateEndpoints: false,
        },
      ),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1");
  });
});
