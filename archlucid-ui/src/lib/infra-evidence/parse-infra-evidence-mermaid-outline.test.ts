import { describe, expect, it } from "vitest";

import {
  parseInfraEvidenceMermaidOutline,
  resolveInfraEvidenceOutlineNodeLabel,
  resolveInfraEvidenceOutlineSeedNodeId,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";

describe("parseInfraEvidenceMermaidOutline", () => {
  it("skips subgraph and end structure lines", () => {
    const source = [
      "flowchart TD",
      "    subgraph rg1[\"RG network\"]",
      "        vnet1[\"vnet-eastus\"]",
      "    end",
      "    subgraph rg2[\"RG data\"]",
      "        vnet2[\"vnet-westus\"]",
      "    end",
    ].join("\n");

    const outline = parseInfraEvidenceMermaidOutline(source);

    expect(outline.nodes.map((node) => node.id)).toEqual(["vnet1", "vnet2"]);
    expect(outline.nodes.map((node) => node.label)).toEqual(["vnet-eastus", "vnet-westus"]);
  });

  it("resolves outline node ids to human-readable labels", () => {
    const outline = parseInfraEvidenceMermaidOutline(
      ['flowchart TD', '    vnet1["vnet-eastus"]', '    vnet1 --> vnet2'].join("\n"),
    );

    expect(resolveInfraEvidenceOutlineNodeLabel(outline.nodes, "vnet1")).toBe("vnet-eastus");
    expect(resolveInfraEvidenceOutlineNodeLabel(outline.nodes, "missing")).toBe("missing");
  });

  it("prefers metadata seed ids over mermaid node hashes", () => {
    expect(
      resolveInfraEvidenceOutlineSeedNodeId({
        id: "n_hash",
        label: "core-vnet",
        resourceType: null,
        resourceGroup: null,
        seedNodeId: "22222222-2222-2222-2222-222222222222",
      }),
    ).toBe("22222222-2222-2222-2222-222222222222");
    expect(
      resolveInfraEvidenceOutlineSeedNodeId({
        id: "n_hash",
        label: "core-vnet",
        resourceType: null,
        resourceGroup: null,
      }),
    ).toBe("n_hash");
  });

  it("parses inventory node metadata comments for resource type and group", () => {
    const outline = parseInfraEvidenceMermaidOutline(
      [
        "flowchart TD",
        "    %% al-type=Microsoft.Network/networkInterfaces al-rg=rg-network",
        '    n_a1["nic-prod"]',
      ].join("\n"),
    );

    expect(outline.nodes).toEqual([
      {
        id: "n_a1",
        label: "nic-prod",
        resourceType: "Microsoft.Network/networkInterfaces",
        resourceGroup: "rg-network",
        seedNodeId: null,
      },
    ]);
  });

  it("still parses legacy inline inventory node metadata comments", () => {
    const outline = parseInfraEvidenceMermaidOutline(
      [
        "flowchart TD",
        '    n_a1["nic-prod"] %% al-type=Microsoft.Network/networkInterfaces al-rg=rg-network al-seed=22222222-2222-2222-2222-222222222222',
      ].join("\n"),
    );

    expect(outline.nodes).toEqual([
      {
        id: "n_a1",
        label: "nic-prod",
        resourceType: "Microsoft.Network/networkInterfaces",
        resourceGroup: "rg-network",
        seedNodeId: "22222222-2222-2222-2222-222222222222",
      },
    ]);
  });

  it("parses own-line inventory seed metadata comments", () => {
    const outline = parseInfraEvidenceMermaidOutline(
      [
        "flowchart TD",
        "    %% al-type=Microsoft.Network/virtualNetworks al-rg=anly-aep-test-hi al-seed=22222222-2222-2222-2222-222222222222",
        '    n_vnet["vnet-aep-hi-test-wus-001"]',
      ].join("\n"),
    );

    expect(outline.nodes).toEqual([
      {
        id: "n_vnet",
        label: "vnet-aep-hi-test-wus-001",
        resourceType: "Microsoft.Network/virtualNetworks",
        resourceGroup: "anly-aep-test-hi",
        seedNodeId: "22222222-2222-2222-2222-222222222222",
      },
    ]);
  });

  it("falls back to RG subgraph labels when metadata comments are absent", () => {
    const outline = parseInfraEvidenceMermaidOutline(
      [
        "flowchart TD",
        '    subgraph rg1["RG rg-network"]',
        '        vnet1["vnet-eastus"]',
        "    end",
      ].join("\n"),
    );

    expect(outline.nodes).toEqual([
      {
        id: "vnet1",
        label: "vnet-eastus",
        resourceType: null,
        resourceGroup: "rg-network",
        seedNodeId: null,
      },
    ]);
  });
});
