import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceDataFlowCaptionDisclosure } from "@/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure";
import { parseInfraDiagramsDataFlowCaptionPresentation } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

describe("InfraEvidenceDataFlowCaptionDisclosure", () => {
  it("renders honesty copy only when metadata comments are absent", () => {
    render(
      <InfraEvidenceDataFlowCaptionDisclosure
        presentation={{
          honestyCaptions: ["Declared pipeline wiring, not observed traffic."],
          metadataComments: [],
        }}
      />,
    );

    expect(screen.getByTestId("infra-diagrams-data-flow-caption")).toHaveTextContent(
      "Declared pipeline wiring, not observed traffic.",
    );
    expect(screen.queryByTestId("infra-diagrams-data-flow-metadata")).not.toBeInTheDocument();
  });

  it("renders honesty sentences and omits compiler comments", () => {
    const evidenceSentence =
      "Evidence of possible or declared movement, not observed traffic. Reads from / Writes to are pipeline wiring. May access is identity authorization. Private network path is a DNS-joined private endpoint hop, not usage.";
    const directionSentence =
      "Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to.";
    const mermaid = [
      "flowchart LR",
      `    %% ${evidenceSentence}`,
      `    %% ${directionSentence}`,
      "    %% al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred",
      "    %% al-provenance=DeterministicInference al-inference=inventory-adf-linked-service-inferred",
      "    %% al-provenance=ObservedFact al-inference=inventory-synapse-linked-service",
      "    %% al-type=TopologyResource al-rg=rg-data al-seed=adf-external:/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-data/providers/Microsoft.DataFactory/factories/adf1|sftp_ahcccs",
      "    %% al-type=TopologyResource al-rg=rg-data al-seed=adf-external:/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-data/providers/Microsoft.DataFactory/factories/adf1|nucc_http",
      "    %% al-type=TopologyResource al-rg=rg-store al-seed=11111111-1111-1111-1111-111111111111",
    ].join("\n");

    render(
      <InfraEvidenceDataFlowCaptionDisclosure
        presentation={parseInfraDiagramsDataFlowCaptionPresentation(mermaid)}
      />,
    );

    const caption = screen.getByTestId("infra-diagrams-data-flow-caption");

    expect(caption).toHaveTextContent(evidenceSentence);
    expect(caption).toHaveTextContent(directionSentence);
    expect(caption).not.toHaveTextContent("al-provenance");
    expect(caption).not.toHaveTextContent("al-inference");
    expect(caption).not.toHaveTextContent("al-seed");
    expect(caption).not.toHaveTextContent("adf-external:");
    expect(screen.queryByTestId("infra-diagrams-data-flow-metadata")).not.toBeInTheDocument();
  });
});
