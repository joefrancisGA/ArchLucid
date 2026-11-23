import { describe, expect, it } from "vitest";
import { EVIDENCE_GRAPH_PATH_ONLY_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-path-only-and-node-focus-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_NODE_FOCUS_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-node-focus-and-edge-focus-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_PATH_ONLY_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-path-only-and-edge-focus-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_TYPE_NODE_FOCUS_AND_PATH_ONLY_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-node-focus-and-path-only-combined-empty-not-load-failure-copy";

describe("score-lift round124 batch honesty", () => {
  it("graph focus combinations", () => {
    expect(EVIDENCE_GRAPH_PATH_ONLY_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_NODE_FOCUS_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_PATH_ONLY_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_TYPE_NODE_FOCUS_AND_PATH_ONLY_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
