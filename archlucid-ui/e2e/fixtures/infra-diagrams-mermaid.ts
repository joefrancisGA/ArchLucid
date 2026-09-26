import type { InfraEvidenceMermaidRenderResponse } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

const VNET_LABELS = [
  "vnet-aep-hi-test-wus-001",
  "vnet-avd-hi-nonprod01",
  "vnet-avd-hi-nprd",
  "vnet-eastus",
  "vnet-eastus-1",
  "vnet-edw-hi-dev",
  "vnet-edw-hi-nprd-wus-001",
  "vnet-edw-hi-ppd",
  "vnet-edw-hi-tst",
  "vnet-pcoe-hi-nprd",
  "vnet-userprovision-hi-nonprod01",
] as const;

function nodeId(label: string): string {
  return label.replace(/[^A-Za-z0-9_]/gu, "_");
}

function buildMermaidBody(edgeLine: (from: string, to: string) => string): string {
  const lines = ["flowchart TD"];

  for (const label of VNET_LABELS) {
    lines.push(`    %% al-type=microsoft.network/virtualnetworks al-rg=rg-${label}`);
    lines.push(`    ${nodeId(label)}["${label}"]`);
  }

  for (let index = 0; index < VNET_LABELS.length - 1; index += 1) {
    lines.push(`    ${edgeLine(nodeId(VNET_LABELS[index]), nodeId(VNET_LABELS[index + 1]))}`);
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Stand-in for inventory-forest layout SVG. Node `class="node"` matches viewport fit queries.
 * Five peering components on a 3-column TD grid (owner-shape Executive forest).
 */
export function elevenVnetOwnerForestLayoutSvg(): string {
  const nodeHeight = 36;
  const nodeWidth = 400;
  const nodeGapY = 20;
  const componentGapX = 48;
  const componentGapY = 40;
  const padding = 16;
  const components: Array<Array<string>> = [
    [VNET_LABELS[0], VNET_LABELS[6], VNET_LABELS[4]],
    [VNET_LABELS[2], VNET_LABELS[7]],
    [VNET_LABELS[1], VNET_LABELS[8]],
    [VNET_LABELS[3], VNET_LABELS[9]],
    [VNET_LABELS[5], VNET_LABELS[10]],
  ];
  const columns = 3;
  const columnWidths = [nodeWidth, nodeWidth, nodeWidth];
  const rowHeights = [
    nodeHeight * 3 + nodeGapY * 2,
    nodeHeight * 2 + nodeGapY,
  ];
  const lines: string[] = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1328 312">'];

  for (let componentIndex = 0; componentIndex < components.length; componentIndex += 1) {
    const row = Math.floor(componentIndex / columns);
    const column = componentIndex % columns;
    let cellX = padding;

    for (let index = 0; index < column; index += 1) {
      cellX += columnWidths[index] + componentGapX;
    }

    let cellY = padding;

    for (let index = 0; index < row; index += 1) {
      cellY += rowHeights[index] + componentGapY;
    }

    const stack = components[componentIndex];

    for (let stackIndex = 0; stackIndex < stack.length; stackIndex += 1) {
      const label = stack[stackIndex];
      const x = cellX;
      const y = cellY + stackIndex * (nodeHeight + nodeGapY);
      lines.push(
        `<g class="node" id="node-${nodeId(label)}" transform="translate(${x},${y})">` +
          `<rect width="${nodeWidth}" height="${nodeHeight}" rx="4" />` +
          `<text x="${nodeWidth / 2}" y="${nodeHeight / 2}" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
          `</g>`,
      );
    }
  }

  lines.push("</svg>");
  return lines.join("");
}

/** @deprecated Use elevenVnetOwnerForestLayoutSvg — kept for import stability in older tests. */
export function elevenVnetOwnerGraphvizLayoutSvg(): string {
  return elevenVnetOwnerForestLayoutSvg();
}

function buildRenderResponse(
  mermaid: string,
  edgeCount: number,
  subgraphCount = 0,
  layoutSvg: string | null = null,
  layoutEngine: string | null = null,
): InfraEvidenceMermaidRenderResponse {
  const nodeCount = VNET_LABELS.length;

  return {
    snapshotId: "22222222-2222-2222-2222-222222222222",
    mode: "executive",
    fallbackKey: null,
    status: "Succeeded",
    mermaid,
    layoutSvg,
    layoutEngine,
    metrics: {
      nodeCount,
      edgeCount,
      subgraphCount,
      maxDegree: edgeCount > 0 ? 2 : 0,
      crossSubgraphEdgeCount: 0,
      textSizeBytes: mermaid.length,
      layoutEstimate: nodeCount + edgeCount,
    },
    fallbackArtifacts: [],
    collapseReport: null,
  };
}

/** Unpacked owner Export Mermaid (docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd). */
export function elevenVnetOwnerExportMermaid(): string {
  return `flowchart TD
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-aep-test-hi al-seed=1427f1dc-311d-4c55-9087-302021307e93
    n_676a3a32ced429b2["vnet-aep-hi-test-wus-001"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-avd-nprd-hi al-seed=2feada5c-5278-4228-8f73-1eef683c2ac6
    n_3473caadcdfee425["vnet-avd-hi-nprd"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-avd-persistent-nonprod-hi al-seed=40ad04a0-2a9e-483a-a8fc-e0eecc8e746b
    n_6b7a82aa5aba78cb["vnet-avd-hi-nonprod01"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-dr-test al-seed=a0909274-0756-430d-943e-6ff8764533da
    n_5abc969203d413eb["vnet-eastus"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-edw-dev-hi al-seed=882cb058-9723-48c6-b4fd-b5af91f23fda
    n_79f11a236d3a7a27["vnet-edw-hi-dev"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-edw-nprd-hi al-seed=149dc82b-c8be-4939-9b79-7405db61c96a
    n_4cf1c68c3fd08226["vnet-edw-hi-nprd-wus-001"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-edw-ppd-hi al-seed=a8f21416-7877-4cd7-a19d-aa4a7a71c17d
    n_725728d8ba3734ad["vnet-edw-hi-ppd"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-edw-tst-hi al-seed=bb91f7ef-c2d9-448b-929f-3129ea451686
    n_61d3f2b65c6d6f70["vnet-edw-hi-tst"]
    %% al-type=microsoft.network/virtualnetworks al-rg=anly-pcoe-hi-nprd al-seed=cb323fd3-2c25-4fdf-a2cc-26383e439cef
    n_a17fa05effe078ad["vnet-pcoe-hi-nprd"]
    %% al-type=microsoft.network/virtualnetworks al-rg=automation-anly-aep-nonprod-hi al-seed=c2f554f1-b79a-4688-87b7-191e85cf9a2c
    n_a46cbfcd8d6132a0["vnet-userprovision-hi-nonprod01"]
    %% al-type=microsoft.network/virtualnetworks al-rg=vm-securenow-dev-01_group al-seed=f220b036-1531-4e08-940a-11bcadcff4d1
    n_d2ba58cce1311fbe["vnet-eastus-1"]
    n_676a3a32ced429b2 --> n_4cf1c68c3fd08226
    n_3473caadcdfee425 --> n_725728d8ba3734ad
    n_6b7a82aa5aba78cb --> n_61d3f2b65c6d6f70
    n_5abc969203d413eb --> n_a17fa05effe078ad
    n_79f11a236d3a7a27 --> n_a46cbfcd8d6132a0
    n_4cf1c68c3fd08226 --> n_d2ba58cce1311fbe
`;
}

/**
 * Compiler/renderer golden for the owner-shape Executive graph (11 VNets / 6 peerings)
 * after IDH-01 row-pack. Source: DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph
 * through MermaidDiagramRenderer — 0 packing subgraphs, layout-only ~~~, six |"peering"| arrows.
 */
export function elevenVnetSparsePeeringMermaid(): string {
  return `flowchart TD
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-0 al-seed=vnet-0
    n_faa008cc79752e5b["vnet-aep-hi-test-wus-001"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-1 al-seed=vnet-1
    n_921b0a636e54b675["vnet-avd-hi-nonprod01"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-10 al-seed=vnet-10
    n_25c297f402f0707e["vnet-userprovision-hi-nonprod01"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-2 al-seed=vnet-2
    n_4c3bc94d23429abf["vnet-avd-hi-nprd"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-3 al-seed=vnet-3
    n_6d475eea46fe20d1["vnet-eastus"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-4 al-seed=vnet-4
    n_3e895df044c2a881["vnet-eastus-1"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-5 al-seed=vnet-5
    n_708ea1a6331ccb16["vnet-edw-hi-dev"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-6 al-seed=vnet-6
    n_a024bdcfecd7841b["vnet-edw-hi-nprd-wus-001"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-7 al-seed=vnet-7
    n_b99e8dfe6dcbb15e["vnet-edw-hi-ppd"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-8 al-seed=vnet-8
    n_97bc743c90f3ec01["vnet-edw-hi-tst"]
    %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-9 al-seed=vnet-9
    n_a33f5b6ab8d05c6f["vnet-pcoe-hi-nprd"]
    n_faa008cc79752e5b -->|"peering"| n_a024bdcfecd7841b
    n_4c3bc94d23429abf -->|"peering"| n_b99e8dfe6dcbb15e
    n_921b0a636e54b675 -->|"peering"| n_97bc743c90f3ec01
    n_6d475eea46fe20d1 -->|"peering"| n_a33f5b6ab8d05c6f
    n_708ea1a6331ccb16 -->|"peering"| n_25c297f402f0707e
    n_a024bdcfecd7841b -->|"peering"| n_3e895df044c2a881
    n_3e895df044c2a881 ~~~ n_4c3bc94d23429abf
    n_97bc743c90f3ec01 ~~~ n_6d475eea46fe20d1
    n_3e895df044c2a881 ~~~ n_6d475eea46fe20d1
`;
}

export function elevenVnetPeerGridMermaid(): string {
  const lines = ["flowchart TD"];

  for (const label of VNET_LABELS) {
    lines.push(`    %% al-type=microsoft.network/virtualnetworks al-rg=rg-${label}`);
    lines.push(`    ${nodeId(label)}["${label}"]`);
  }

  const columns = 5;

  for (let index = 0; index < VNET_LABELS.length; index += 1) {
    const below = index + columns;

    if (below >= VNET_LABELS.length) {
      continue;
    }

    lines.push(`    ${nodeId(VNET_LABELS[index])} ~~~ ${nodeId(VNET_LABELS[below])}`);
  }

  return `${lines.join("\n")}\n`;
}

export function elevenVnetChainLegacyMermaid(): string {
  return buildMermaidBody((from, to) => `${from} --> ${to}`);
}

export function elevenVnetPeerGridRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return buildRenderResponse(elevenVnetPeerGridMermaid(), 0);
}

export function elevenVnetChainLegacyRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return buildRenderResponse(elevenVnetChainLegacyMermaid(), 10);
}

export function elevenVnetSparsePeeringRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return buildRenderResponse(elevenVnetSparsePeeringMermaid(), 6, 0);
}

/** Owner-shape Executive with inventory-forest canvas layout. */
export function elevenVnetOwnerForestRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return buildRenderResponse(
    elevenVnetSparsePeeringMermaid(),
    6,
    0,
    elevenVnetOwnerForestLayoutSvg(),
    "inventory-forest",
  );
}

/** @deprecated Use elevenVnetOwnerForestRenderResponse. */
export function elevenVnetOwnerGraphvizRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return elevenVnetOwnerForestRenderResponse();
}

/** Mermaid-only fail-soft path — must not use the owner-shape Graphviz default. */
export function elevenVnetSparsePeeringMermaidOnlyRenderResponse(): InfraEvidenceMermaidRenderResponse {
  return buildRenderResponse(elevenVnetSparsePeeringMermaid(), 6, 0, null, "mermaid-dagre");
}

/** Executive Web App → SQL **May access** authorization overlay (AX-DC-07). */
export function executiveMayAccessMermaid(): string {
  return `flowchart TD
    %% al-type=Microsoft.Web/sites al-rg=rg-app
    web_app["orders-api"]
    %% al-type=Microsoft.Sql/servers/databases al-rg=rg-data
    sql_db["orders-db"]
    %% al-provenance=DerivedFact al-inference=inventory-app-authorized-access
    web_app -.->|"May access"| sql_db
`;
}

export function executiveMayAccessRenderResponse(): InfraEvidenceMermaidRenderResponse {
  const mermaid = executiveMayAccessMermaid();

  return {
    snapshotId: "22222222-2222-2222-2222-222222222222",
    mode: "executive",
    fallbackKey: null,
    status: "Succeeded",
    mermaid,
    layoutSvg: null,
    layoutEngine: "mermaid-dagre",
    metrics: {
      nodeCount: 2,
      edgeCount: 1,
      subgraphCount: 0,
      maxDegree: 1,
      crossSubgraphEdgeCount: 0,
      textSizeBytes: mermaid.length,
      layoutEstimate: 3,
    },
    fallbackArtifacts: [],
    collapseReport: null,
    completenessWarnings: [],
    collapseReport: null,
  };
}
