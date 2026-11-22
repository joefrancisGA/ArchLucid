import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_QUEUE_HEADER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-queue-header-partial-capture-copy";
import { RESOURCE_EXPLORER_CATEGORY_AND_NAME_PREFIX_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-category-and-name-prefix-combined-filter-empty-not-load-failure-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/insights/evidence-graph-type-filter-and-node-focus-combined-empty-not-load-failure-copy";
import { CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/integrations/connection-status-category-and-subscription-scope-filter-empty-not-load-failure-copy";

describe("score-lift round86 batch honesty", () => {
  it("explorer category and prefix, graph type and focus, connection category and scope, findings header", () => {
    expect(RESOURCE_EXPLORER_CATEGORY_AND_NAME_PREFIX_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("prefix");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_AND_NODE_FOCUS_COMBINED_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("focus");
    expect(CONNECTION_STATUS_CATEGORY_AND_SUBSCRIPTION_SCOPE_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("subscription");
    expect(GOVERNANCE_FINDINGS_QUEUE_HEADER_PARTIAL_CAPTURE_LINE).toContain("Partial capture");
  });
});
