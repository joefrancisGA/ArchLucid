import { describe, expect, it } from "vitest";

import {
  isInfraEvidenceDataFlowMermaid,
  isInfraEvidenceMermaidMetadataComment,
  parseInfraDiagramsDataFlowCaptionPresentation,
  parseInfraDiagramsDataFlowCaptionsFromMermaid,
} from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

describe("infra-evidence-data-flow-diagram", () => {
  it("detects inventory metadata comments", () => {
    expect(isInfraEvidenceMermaidMetadataComment("al-type=microsoft.app/containerapps al-rg=rg-app")).toBe(true);
    expect(
      isInfraEvidenceMermaidMetadataComment(
        "al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred",
      ),
    ).toBe(true);
    expect(isInfraEvidenceMermaidMetadataComment("al-declared-id=edge-1 al-state=active")).toBe(true);
    expect(isInfraEvidenceMermaidMetadataComment("keep this node al-outline-only=true")).toBe(true);
    expect(
      isInfraEvidenceMermaidMetadataComment(
        "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
      ),
    ).toBe(false);
  });

  it("filters inventory metadata comments from data flow captions", () => {
    const mermaid = [
      "flowchart LR",
      "    %% Declared pipeline wiring, not observed traffic.",
      "    %% al-type=microsoft.app/containerapps al-rg=rg-app al-seed=11111111-1111-1111-1111-111111111111",
      "    node1[adf1]",
    ].join("\n");

    expect(parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaid)).toEqual([
      "Declared pipeline wiring, not observed traffic.",
    ]);
  });

  it("parses caption comments from data flow mermaid", () => {
    const mermaid = [
      "flowchart LR",
      "    %% Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
      "    node1[adf1]",
    ].join("\n");

    expect(parseInfraDiagramsDataFlowCaptionsFromMermaid(mermaid)).toEqual([
      "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
    ]);
    expect(isInfraEvidenceDataFlowMermaid(mermaid)).toBe(true);
  });

  it("splits honesty captions from al-type metadata comments", () => {
    const mermaid = [
      "flowchart LR",
      "    %% Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
      "    %% al-type=microsoft.app/containerapps al-rg=rg-ArchLucid-dev-cus al-seed=d438351f-d431-407f-9345-b70d16567fd2",
      "    %% al-type=microsoft.storage/storageaccounts al-rg=cloud-shell-storage-eastus al-seed=312ff215-2a8f-433a-95f6-5ef621b78109",
      "    node1[adf1]",
    ].join("\n");

    expect(parseInfraDiagramsDataFlowCaptionPresentation(mermaid)).toEqual({
      honestyCaptions: [
        "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
      ],
      metadataComments: [
        "al-type=microsoft.app/containerapps al-rg=rg-ArchLucid-dev-cus al-seed=d438351f-d431-407f-9345-b70d16567fd2",
        "al-type=microsoft.storage/storageaccounts al-rg=cloud-shell-storage-eastus al-seed=312ff215-2a8f-433a-95f6-5ef621b78109",
      ],
    });
  });

  it("keeps evidence sentences and classifies provenance comments as metadata", () => {
    const evidenceSentence =
      "Evidence of possible or declared movement, not observed traffic. Reads from / Writes to are pipeline wiring. May access is identity authorization. Private network path is a DNS-joined private endpoint hop, not usage.";
    const mermaid = [
      "flowchart LR",
      `    %% ${evidenceSentence}`,
      "    %% al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred",
      "    %% al-provenance=DeterministicInference al-inference=inventory-adf-linked-service-inferred",
      "    %% al-provenance=ObservedFact al-inference=inventory-synapse-linked-service al-declared-id=edge-3",
      "    %% al-type=TopologyResource al-rg=rg-data al-seed=adf-external:/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-data/providers/Microsoft.DataFactory/factories/adf1|sftp_ahcccs",
      "    %% al-type=TopologyResource al-rg=rg-data al-seed=adf-external:/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-data/providers/Microsoft.DataFactory/factories/adf1|nucc_http",
      "    %% al-type=TopologyResource al-rg=rg-store al-seed=11111111-1111-1111-1111-111111111111 al-outline-only=false",
      "    node1[adf1]",
    ].join("\n");

    const presentation = parseInfraDiagramsDataFlowCaptionPresentation(mermaid);

    expect(presentation.honestyCaptions).toEqual([evidenceSentence]);
    expect(presentation.metadataComments).toHaveLength(6);
    expect(presentation.honestyCaptions.join(" ")).not.toMatch(/al-provenance|al-inference|al-seed|adf-external:/u);
  });
});
