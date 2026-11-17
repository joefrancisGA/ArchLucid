import { describe, expect, it } from "vitest";

import { CONNECTION_STATUS_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/administration/connection-status-empty-partial-capture-copy";
import { COMPARE_FINDING_CORRELATION_PARTIAL_RESULTS_LINE } from "@/lib/compare-finding-correlation-partial-results-copy";
import { DIGESTS_BROWSE_SCOPED_FILTER_PARTIAL_CAPTURE_LINE } from "@/lib/digests/digests-browse-scoped-filter-partial-capture-copy";
import { SIGNED_RECORDS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-filter-empty-partial-capture-copy";
import { SIGNED_RECORDS_UNSCOPED_LIST_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-unscoped-list-partial-capture-copy";
import { EVIDENCE_GRAPH_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/evidence-graph-empty-partial-capture-copy";
import { RESOURCE_HUB_AUDIT_TAB_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/resource-hub-audit-tab-partial-capture-copy";
import { TERRAFORM_WORKBENCH_MAPPING_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/terraform-workbench-mapping-empty-partial-capture-copy";

describe("score-lift round69 batch honesty", () => {
  it("connection status, digest filter, compare results, hub audit, terraform, graph, sealed records", () => {
    expect(CONNECTION_STATUS_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(DIGESTS_BROWSE_SCOPED_FILTER_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(COMPARE_FINDING_CORRELATION_PARTIAL_RESULTS_LINE).toContain("partial");
    expect(RESOURCE_HUB_AUDIT_TAB_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(TERRAFORM_WORKBENCH_MAPPING_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(EVIDENCE_GRAPH_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(SIGNED_RECORDS_FILTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(SIGNED_RECORDS_UNSCOPED_LIST_PARTIAL_CAPTURE_LINE).toContain("Partial");
  });
});