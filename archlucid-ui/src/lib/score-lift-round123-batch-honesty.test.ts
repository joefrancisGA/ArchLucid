import { describe, expect, it } from "vitest";
import { EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-edge-focus-only-empty-partial-capture-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_SCOPE_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-scope-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_PATH_ONLY_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-path-only-combined-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-edge-focus-combined-empty-not-load-failure-copy";

describe("score-lift round123 batch honesty", () => {
  it("edge partial and type-filter combinations", () => {
    expect(EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_PARTIAL_CAPTURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_AND_SCOPE_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_AND_PATH_ONLY_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_AND_EDGE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
