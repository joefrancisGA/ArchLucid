import { describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_PRIORITY_QUEUE_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-priority-queue-load-failure-partial-capture-copy";
import { REMEDIATION_PATTERNS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-pattern/remediation-patterns-filter-empty-partial-capture-copy";
import { SIGNED_RECORDS_DATE_RANGE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-date-range-filter-empty-partial-capture-copy";
import { STANDARDS_RULES_WORKING_FILTER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/standards-rules-working-filter-partial-capture-copy";

describe("score-lift round72 batch honesty", () => {
  it("working standards filter, factory queue load failure, patterns filter, sealed date range", () => {
    expect(STANDARDS_RULES_WORKING_FILTER_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_PRIORITY_QUEUE_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_PATTERNS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(SIGNED_RECORDS_DATE_RANGE_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });
});