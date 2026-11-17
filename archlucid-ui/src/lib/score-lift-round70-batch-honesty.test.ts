import { describe, expect, it } from "vitest";

import { GOVERNANCE_FINDINGS_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-filter-no-match-partial-capture-copy";
import { STANDARDS_RULES_FILTER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/standards-rules-filter-partial-capture-copy";
import { EVIDENCE_GRAPH_LOADED_ZERO_NODES_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-loaded-zero-nodes-partial-capture-copy";
import { POLICY_PACKS_ENFORCED_RULES_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-enforced-rules-empty-partial-capture-copy";
import { POLICY_PACKS_REGISTERED_LIST_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-registered-list-empty-partial-capture-copy";
import { POLICY_PACKS_WORKSPACE_SELECTION_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-workspace-selection-empty-partial-capture-copy";
import { REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-priority-queue-empty-partial-capture-copy";

describe("score-lift round70 batch honesty", () => {
  it("findings filter, policy packs, standards filter, graph loaded, factory queue", () => {
    expect(GOVERNANCE_FINDINGS_FILTER_NO_MATCH_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(POLICY_PACKS_REGISTERED_LIST_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(POLICY_PACKS_WORKSPACE_SELECTION_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(POLICY_PACKS_ENFORCED_RULES_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(STANDARDS_RULES_FILTER_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(EVIDENCE_GRAPH_LOADED_ZERO_NODES_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });
});