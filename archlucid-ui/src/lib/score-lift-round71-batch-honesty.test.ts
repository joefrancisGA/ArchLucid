import { describe, expect, it } from "vitest";

import { COMPARE_FINDING_CORRELATION_ZERO_COUNTS_PARTIAL_CAPTURE_LINE } from "@/lib/compare-finding-correlation-zero-counts-partial-capture-copy";
import { compareFindingCorrelationCountsAreAllZero } from "@/lib/compare-finding-correlation-counts-all-zero";
import { STANDARDS_RULES_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/standards-rules-catalog-empty-partial-capture-copy";
import { EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-type-filter-empty-partial-capture-copy";
import { RESOURCE_EXPLORER_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/resource-explorer-filter-empty-partial-capture-copy";
import { POLICY_PACKS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-packs-catalog-empty-partial-capture-copy";

describe("score-lift round71 batch honesty", () => {
  it("catalog, standards catalog, graph type filter, compare zero counts, resource explorer", () => {
    expect(POLICY_PACKS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(STANDARDS_RULES_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(EVIDENCE_GRAPH_TYPE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(COMPARE_FINDING_CORRELATION_ZERO_COUNTS_PARTIAL_CAPTURE_LINE).toContain("partial");
    expect(RESOURCE_EXPLORER_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });

  it("compareFindingCorrelationCountsAreAllZero", () => {
    expect(
      compareFindingCorrelationCountsAreAllZero({
        primaryCorrelationMethod: "Mixed",
        honestyNote: "",
        policyRuleMatchCount: 0,
        fuzzyMatchCount: 0,
        unmatchedLeftCount: 0,
        unmatchedRightCount: 0,
      }),
    ).toBe(true);
    expect(
      compareFindingCorrelationCountsAreAllZero({
        primaryCorrelationMethod: "Mixed",
        honestyNote: "",
        policyRuleMatchCount: 1,
        fuzzyMatchCount: 0,
        unmatchedLeftCount: 0,
        unmatchedRightCount: 0,
      }),
    ).toBe(false);
  });
});