import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfraEvidenceDataFlowCaptionDisclosure } from "@/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DATA_FLOW_CAPTION_TITLE } from "@/lib/governance/governance-infrastructure-copy";

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

  it("collapses al-type metadata behind a triangle disclosure by default", () => {
    render(
      <InfraEvidenceDataFlowCaptionDisclosure
        presentation={{
          honestyCaptions: [
            "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription.",
          ],
          metadataComments: [
            "al-type=microsoft.app/containerapps al-rg=rg-ArchLucid-dev-cus al-seed=d438351f-d431-407f-9345-b70d16567fd2",
          ],
        }}
      />,
    );

    const disclosure = screen.getByTestId("infra-diagrams-data-flow-caption");

    expect(disclosure).toHaveTextContent(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DATA_FLOW_CAPTION_TITLE);
    expect(disclosure).toHaveTextContent("External systems appear when a linked service names them");
    expect(screen.queryByTestId("infra-diagrams-data-flow-metadata")).not.toBeVisible();

    fireEvent.click(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DATA_FLOW_CAPTION_TITLE));

    expect(screen.getByTestId("infra-diagrams-data-flow-metadata")).toBeVisible();
    expect(screen.getByTestId("infra-diagrams-data-flow-metadata")).toHaveTextContent(
      "al-type=microsoft.app/containerapps",
    );
  });
});
