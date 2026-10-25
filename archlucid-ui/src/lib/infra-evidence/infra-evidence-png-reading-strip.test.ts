import { describe, expect, it } from "vitest";

import { buildInfraEvidencePngReadingStripLines } from "@/lib/infra-evidence/infra-evidence-png-reading-strip";

describe("infra-evidence-png-reading-strip", () => {
  it("includes the data-flow job and applicable stroke rows", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "dataFlow",
      outline: {
        nodes: [],
        edges: [
          {
            from: "app",
            to: "sql",
            label: "May access",
            source: "probable",
            confidenceBand: "probable",
            provenanceKind: "DerivedFact",
            inferenceSource: "inventory-app-authorized-access",
            declaredConnectionId: null,
          },
        ],
      },
      completenessWarnings: [],
    });

    expect(lines).toContain("This diagram shows what may connect. It is not observed traffic.");
    expect(lines).toContain("Dashed — probable authorization or declared wiring (RBAC / ADF; not runtime traffic)");
  });

  it("omits the data-flow job from network exports", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });

    expect(lines).not.toContain("This diagram shows what may connect. It is not observed traffic.");
    expect(lines).not.toContain("Diagram outline was not stored.");
  });

  it("labels null outline and mode without treating empty edges as missing (P-08–P-09)", () => {
    const nullOutline = buildInfraEvidencePngReadingStripLines({
      mode: "dataFlow",
      outline: null,
      completenessWarnings: [],
    });
    expect(nullOutline).toContain("Diagram outline was not stored.");
    expect(nullOutline).toContain("This diagram shows what may connect. It is not observed traffic.");

    const emptyEdges = buildInfraEvidencePngReadingStripLines({
      mode: "",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });
    expect(emptyEdges).not.toContain("Diagram outline was not stored.");
    expect(emptyEdges).toContain("Diagram mode was stored empty.");

    const nullMode = buildInfraEvidencePngReadingStripLines({
      mode: null,
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });
    expect(nullMode).toContain("Diagram mode was not stored.");

    const unknownMode = buildInfraEvidencePngReadingStripLines({
      mode: "inventory",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });
    expect(unknownMode).toContain(
      "Diagram mode was stored as inventory. It is not one of the labeled inventory modes.",
    );
  });

  it("includes a warning count and bounded human-readable warning titles", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "executive",
      outline: null,
      completenessWarnings: [
        "app-settings-not-collected-hosted-get-only",
        "rbac-scope-too-broad:/subscriptions/sub",
      ],
    });

    expect(lines).toContain("Inventory completeness warnings (2). Connection lines may be missing.");
    expect(lines).toContain("Warning: App setting hostnames not collected on hosted pull");
    expect(lines.join("\n")).not.toContain("/subscriptions/sub");
  });

  it("does not claim observed inventory for edges without ObservedFact provenance (P-01)", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: {
        nodes: [],
        edges: [
          {
            from: "a",
            to: "b",
            label: "connects",
            source: "observed",
            confidenceBand: "observed",
            provenanceKind: "NotAFact",
            inferenceSource: null,
            declaredConnectionId: null,
          },
        ],
      },
      completenessWarnings: [],
    });

    expect(lines).not.toContain("Solid — observed in Azure inventory");
  });

  it("adds configuration relationship note when static site backend edges exist (P-05)", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: {
        nodes: [],
        edges: [
          {
            from: "site",
            to: "api",
            label: "Linked backend",
            source: "observed",
            confidenceBand: "observed",
            provenanceKind: "ObservedFact",
            inferenceSource: "inventory-static-site-backend",
            declaredConnectionId: null,
          },
        ],
      },
      completenessWarnings: [],
    });

    expect(lines).toContain(
      "Linked backends, capacity assignments, and diagnostic settings on this diagram are configuration. They are not observed traffic.",
    );
  });

  it("adds data-architecture and inventory-structure mode sentences (P-06)", () => {
    const dataArchitecture = buildInfraEvidencePngReadingStripLines({
      mode: "dataArchitecture",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });
    const network = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });

    expect(dataArchitecture).toContain("This diagram shows what stores data. It is not observed traffic.");
    expect(network).toContain("This diagram shows inventory structure. It is not observed traffic.");
    expect(network).not.toContain("This diagram shows what may connect.");
  });

  it("adds snapshot and scope lines for PNG exports (P-08–P-09)", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
      snapshotLabel: "Contoso Production · 9/10/2026, 09:45 EDT",
      resourceGroupScopeName: "rg-network",
      dependencyNeighborhoodSeedLabel: "",
    });

    expect(lines[0]).toBe("Snapshot: Contoso Production · 9/10/2026, 09:45 EDT");
    expect(lines).toContain("Scope: resource group rg-network.");
    expect(lines).toContain("Dependency neighborhood starting resource was not stored.");
  });

  it("labels dependency neighborhood scope without depends-on wording", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "dependencyNeighborhood",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
      dependencyNeighborhoodSeedLabel: "app-gateway",
    });

    expect(lines).toContain("Scope: neighbors of app-gateway on cited lines.");
    expect(lines.join("\n")).not.toMatch(/depends on|dependency neighborhood from/i);
  });

  it("labels a missing snapshot line without inventing a capture time", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
      snapshotLabel: "   ",
    });

    expect(lines[0]).toBe("Snapshot label was not stored.");
  });

  it("does not claim that a data-flow line was observed traffic", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "dataFlow",
      outline: { nodes: [], edges: [] },
      completenessWarnings: [],
    });

    expect(lines.join("\n")).not.toContain("Observed traffic occurred");
  });
});
