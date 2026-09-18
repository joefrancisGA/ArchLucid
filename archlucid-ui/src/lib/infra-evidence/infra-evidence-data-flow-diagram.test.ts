import { describe, expect, it } from "vitest";

import {
  isInfraEvidenceDataFlowMermaid,
  isInfraEvidenceMermaidMetadataComment,
  parseInfraDiagramsDataFlowCaptionsFromMermaid,
} from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

describe("infra-evidence-data-flow-diagram", () => {
  it("detects inventory metadata comments", () => {
    expect(isInfraEvidenceMermaidMetadataComment("al-type=microsoft.app/containerapps al-rg=rg-app")).toBe(true);
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
});
