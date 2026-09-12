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

function buildRenderResponse(mermaid: string, edgeCount: number): InfraEvidenceMermaidRenderResponse {
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
      subgraphCount: 0,
      maxDegree: edgeCount > 0 ? 2 : 0,
      crossSubgraphEdgeCount: 0,
      textSizeBytes: mermaid.length,
      layoutEstimate: nodeCount + edgeCount,
    },
    fallbackArtifacts: [],
  };
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
