import { describe, expect, it } from "vitest";
import { EVIDENCE_GRAPH_PATH_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-path-only-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-edge-focus-only-empty-not-load-failure-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-assigned-to-me-empty-partial-capture-not-load-failure-copy";
import { GOLDEN_MANIFEST_MARKDOWN_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/exports/golden-manifest-markdown-export-finalize-not-load-failure-copy";

describe("score-lift round107 batch honesty", () => {
  it("graph path-only, edge focus, assigned partial capture, golden manifest markdown", () => {
    expect(EVIDENCE_GRAPH_PATH_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_EDGE_FOCUS_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOVERNANCE_ASSIGNED_TO_ME_EMPTY_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOLDEN_MANIFEST_MARKDOWN_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
