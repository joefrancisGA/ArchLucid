import { describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-executive-metrics-load-failure-partial-capture-copy";
import { REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-ranked-paths-empty-partial-capture-copy";
import { REMEDIATION_FACTORY_RANKED_PATHS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-ranked-paths-load-failure-partial-capture-copy";
import { REMEDIATION_FACTORY_RANKED_PATHS_VIEW_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-factory/remediation-factory-ranked-paths-view-filter-empty-partial-capture-copy";
import { REMEDIATION_PATTERNS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/remediation-pattern/remediation-patterns-catalog-empty-partial-capture-copy";

describe("score-lift round73 batch honesty", () => {
  it("factory metrics and ranked paths load, empties, view filter, patterns catalog", () => {
    expect(REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_RANKED_PATHS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_RANKED_PATHS_VIEW_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REMEDIATION_PATTERNS_CATALOG_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });
});