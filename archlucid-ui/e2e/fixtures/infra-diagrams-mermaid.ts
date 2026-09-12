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

function buildRenderResponse(
  mermaid: string,
  edgeCount: number,
  subgraphCount = 0,
): InfraEvidenceMermaidRenderResponse {
  const nodeCount = VNET_LABELS.length;

  return {
    snapshotId: "22222222-2222-2222-2222-222222222222",
    mode: "executive",
    fallbackKey: null,
    status: "Succeeded",
    mermaid,
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
  };
}

/** Golden output from DiagramSparseComponentPacker on the owner-shape 11 VNet / 6 peering fixture. */
export function elevenVnetSparsePeeringMermaid(): string {
  return `flowchart TD
    subgraph alpack_0[" "]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-0 al-seed=vnet-0
        n_faa008cc79752e5b["vnet-aep-hi-test-wus-001"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-4 al-seed=vnet-4
        n_3e895df044c2a881["vnet-eastus-1"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-6 al-seed=vnet-6
        n_a024bdcfecd7841b["vnet-edw-hi-nprd-wus-001"]
    end
    style alpack_0 fill:transparent,stroke:none
    subgraph alpack_1[" "]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-1 al-seed=vnet-1
        n_921b0a636e54b675["vnet-avd-hi-nonprod01"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-9 al-seed=vnet-9
        n_a33f5b6ab8d05c6f["vnet-pcoe-hi-nprd"]
    end
    style alpack_1 fill:transparent,stroke:none
    subgraph alpack_2[" "]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-10 al-seed=vnet-10
        n_25c297f402f0707e["vnet-userprovision-hi-nonprod01"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-8 al-seed=vnet-8
        n_97bc743c90f3ec01["vnet-edw-hi-tst"]
    end
    style alpack_2 fill:transparent,stroke:none
    subgraph alpack_3[" "]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-2 al-seed=vnet-2
        n_4c3bc94d23429abf["vnet-avd-hi-nprd"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-7 al-seed=vnet-7
        n_b99e8dfe6dcbb15e["vnet-edw-hi-ppd"]
    end
    style alpack_3 fill:transparent,stroke:none
    subgraph alpack_4[" "]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-3 al-seed=vnet-3
        n_6d475eea46fe20d1["vnet-eastus"]
        %% al-type=Microsoft.Network/virtualNetworks al-rg=network-rg-5 al-seed=vnet-5
        n_708ea1a6331ccb16["vnet-edw-hi-dev"]
    end
    style alpack_4 fill:transparent,stroke:none
    n_faa008cc79752e5b -->|"peered"| n_a024bdcfecd7841b
    n_4c3bc94d23429abf -->|"peered"| n_b99e8dfe6dcbb15e
    n_a024bdcfecd7841b -->|"peered"| n_3e895df044c2a881
    n_921b0a636e54b675 -->|"peered"| n_a33f5b6ab8d05c6f
    n_6d475eea46fe20d1 -->|"peered"| n_708ea1a6331ccb16
    n_97bc743c90f3ec01 -->|"peered"| n_25c297f402f0707e
    n_faa008cc79752e5b ~~~ n_6d475eea46fe20d1
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
  return buildRenderResponse(elevenVnetSparsePeeringMermaid(), 6, 5);
}
