import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceMermaidAlwaysExcludedReason,
  formatInfraEvidenceMermaidFallbackArtifactMetricsLine,
  formatInfraEvidenceMermaidRenderFailureDescription,
  INFRA_EVIDENCE_MERMAID_ALWAYS_EXCLUDED_REASON_NOT_STORED,
  INFRA_EVIDENCE_MERMAID_FALLBACK_STATUS_NOT_STORED,
  INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED,
} from "./format-infra-evidence-mermaid-fallback-artifact-copy";

describe("format-infra-evidence-mermaid-fallback-artifact-copy", () => {
  it("labels missing fallback status and counts while preserving stored zero", () => {
    expect(
      formatInfraEvidenceMermaidFallbackArtifactMetricsLine({
        nodeCount: null,
        edgeCount: 0,
        status: null,
      }),
    ).toContain(INFRA_EVIDENCE_MERMAID_FALLBACK_STATUS_NOT_STORED);
    expect(
      formatInfraEvidenceMermaidFallbackArtifactMetricsLine({
        nodeCount: null,
        edgeCount: 0,
        status: null,
      }),
    ).toContain("0 edges");
  });

  it("labels a missing render failure reason without replacing a stored reason", () => {
    expect(formatInfraEvidenceMermaidRenderFailureDescription(null)).toBe(
      INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED,
    );
    expect(formatInfraEvidenceMermaidRenderFailureDescription("Simulated render failure.")).toBe(
      "Simulated render failure.",
    );
    expect(formatInfraEvidenceMermaidRenderFailureDescription("")).toBe(
      INFRA_EVIDENCE_MERMAID_RENDER_FAILURE_REASON_NOT_STORED,
    );
  });

  it("labels a missing always-excluded reason without inventing copy", () => {
    expect(formatInfraEvidenceMermaidAlwaysExcludedReason(undefined)).toBe(
      INFRA_EVIDENCE_MERMAID_ALWAYS_EXCLUDED_REASON_NOT_STORED,
    );
  });
});
