import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK,
  ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO,
  buildArchitectureIntelligenceEvidenceGraphVocabulary,
  resolveArchitectureIntelligenceEvidenceGraphPeerLink,
} from "@/lib/vocabulary/architecture-intelligence-evidence-graph-vocabulary";
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture-intelligence-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

describe("architecture-intelligence-evidence-graph-vocabulary (TB-2273)", () => {
  it("explains architecture intelligence vs evidence graph", () => {
    const model = buildArchitectureIntelligenceEvidenceGraphVocabulary();

    expect(model.heading).toBe(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING);
    expect(model.heading.toLowerCase()).toContain("architecture intelligence");
    expect(model.heading.toLowerCase()).toContain("evidence graph");
    expect(model.whyTwo).toBe(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("closed-loop");
    expect(model.whyTwo.toLowerCase()).toContain("provenance");
    expect(model.compactLine).toBe(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE);

    expect(model.architectureIntelligenceLink).toEqual(
      ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK,
    );
    expect(model.architectureIntelligenceLink.href).toBe(ARCHITECTURE_INTELLIGENCE_PATH);
    expect(model.architectureIntelligenceLink.href).toBe("/architecture/architecture-intelligence");

    expect(model.evidenceGraphLink).toEqual(ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK);
    expect(model.evidenceGraphLink.href).toBe(EVIDENCE_GRAPH_PATH);
    expect(model.evidenceGraphLink.href).toBe("/insights/evidence-graph");
  });

  it("resolves the peer surface from intelligence and evidence graph", () => {
    expect(resolveArchitectureIntelligenceEvidenceGraphPeerLink("architecture-intelligence")).toEqual(
      ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK,
    );

    expect(resolveArchitectureIntelligenceEvidenceGraphPeerLink("evidence-graph")).toEqual(
      ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK,
    );
  });
});
