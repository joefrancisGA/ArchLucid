import { describe, expect, it } from "vitest";

import {
  exceedsInfraEvidenceMermaidClientGuard,
  INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS,
} from "@/lib/infra-evidence/infra-evidence-mermaid-client-guard";

describe("infra-evidence-mermaid-client-guard", () => {
  it("flags metrics above IE-17 readability thresholds", () => {
    expect(exceedsInfraEvidenceMermaidClientGuard(null)).toBe(false);
    expect(
      exceedsInfraEvidenceMermaidClientGuard({
        nodeCount: INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS.maxNodes,
        edgeCount: 10,
        subgraphCount: 1,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 100,
        layoutEstimate: 100,
      }),
    ).toBe(false);
    expect(
      exceedsInfraEvidenceMermaidClientGuard({
        nodeCount: INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS.maxNodes + 1,
        edgeCount: 10,
        subgraphCount: 1,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 100,
        layoutEstimate: 100,
      }),
    ).toBe(true);
  });
});
