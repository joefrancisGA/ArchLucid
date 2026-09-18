import { describe, expect, it } from "vitest";

import {
  isInfraEvidenceDataFlowMermaid,
  parseInfraDiagramsDataFlowCaptionsFromMermaid,
} from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";

describe("infra-evidence-data-flow-diagram", () => {
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
