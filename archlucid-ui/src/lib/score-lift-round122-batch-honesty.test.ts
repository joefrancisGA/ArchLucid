import { describe, expect, it } from "vitest";
import { RESOURCE_EXPLORER_WORK_QUEUE_TYPE_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-work-queue-type-prefix-and-resource-group-filter-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-node-focus-only-empty-partial-capture-copy";
import { EVIDENCE_GRAPH_PATH_ONLY_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-path-only-empty-partial-capture-copy";

describe("score-lift round122 batch honesty", () => {
  it("explorer quadruple and graph partial capture", () => {
    expect(RESOURCE_EXPLORER_WORK_QUEUE_TYPE_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(EVIDENCE_GRAPH_NODE_FOCUS_ONLY_EMPTY_PARTIAL_CAPTURE_LINE).toContain("not proof");
    expect(EVIDENCE_GRAPH_PATH_ONLY_EMPTY_PARTIAL_CAPTURE_LINE).toContain("not proof");
  });
});
