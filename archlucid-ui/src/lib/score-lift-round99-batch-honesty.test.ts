import { describe, expect, it } from "vitest";
import {
  EVIDENCE_GRAPH_PNG_RASTER_FAILURE_NOT_EMPTY_GRAPH_LINE,
  EVIDENCE_GRAPH_PNG_TAINTED_NOT_EMPTY_GRAPH_LINE,
} from "@/lib/insights/evidence-graph-png-raster-honesty-copy";
import { DIAGRAM_PNG_SERVER_UNAVAILABLE_LINE } from "@/lib/infra-evidence/diagram-png-server-unavailable-copy";
import { GRAPH_SNAPSHOT_REUSE_OBSERVATION_STAMP_LINE } from "@/lib/reviews/graph-snapshot-reuse-observation-stamp-copy";
import { DIAGNOSTIC_DESTINATION_NULL_NOT_EMPTY_LIST_LINE } from "@/lib/infra-evidence/diagnostic-destination-null-not-empty-list-copy";

describe("score-lift round99 batch honesty", () => {
  it("graph png, diagram renderer, reuse stamp, diagnostic destination", () => {
    expect(EVIDENCE_GRAPH_PNG_TAINTED_NOT_EMPTY_GRAPH_LINE).toContain("tainted");
    expect(EVIDENCE_GRAPH_PNG_RASTER_FAILURE_NOT_EMPTY_GRAPH_LINE).toContain("rasterization");
    expect(DIAGRAM_PNG_SERVER_UNAVAILABLE_LINE).toContain("renderer");
    expect(GRAPH_SNAPSHOT_REUSE_OBSERVATION_STAMP_LINE).toContain("prior snapshot");
    expect(DIAGNOSTIC_DESTINATION_NULL_NOT_EMPTY_LIST_LINE).toContain("null");
  });
});
