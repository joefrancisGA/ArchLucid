import { describe, expect, it } from "vitest";

import {
  RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE,
  RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK,
  RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING,
  RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK,
  RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO,
  buildRunProvenanceEvidenceGraphVocabulary,
  resolveRunProvenanceEvidenceGraphPeerLink,
} from "@/lib/vocabulary/run-provenance-evidence-graph-vocabulary";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

describe("run-provenance-evidence-graph-vocabulary (TB-2296)", () => {
  it("explains per-package provenance vs cross-package evidence graph", () => {
    const model = buildRunProvenanceEvidenceGraphVocabulary();

    expect(model.heading).toBe(RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING);
    expect(model.whyTwo).toBe(RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("one architecture review");
    expect(model.whyTwo.toLowerCase()).toContain("across packages");
    expect(model.compactLine).toBe(RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE);

    expect(model.runProvenanceLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.evidenceGraphLink.href).toBe(EVIDENCE_GRAPH_PATH);
  });

  it("resolves the peer surface from run provenance and evidence graph", () => {
    expect(resolveRunProvenanceEvidenceGraphPeerLink("run-provenance")).toEqual(
      RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK,
    );

    expect(resolveRunProvenanceEvidenceGraphPeerLink("evidence-graph")).toEqual(
      RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK,
    );
  });
});
