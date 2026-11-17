import { describe, expect, it } from "vitest";

import { COMPARE_INSUFFICIENT_FINALIZED_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/compare-insufficient-finalized-partial-capture-copy";
import { DIGESTS_BROWSE_SETUP_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/digests/digests-browse-setup-empty-partial-capture-copy";
import { GOVERNANCE_APPROVAL_QUEUE_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-queue-empty-partial-capture-copy";
import { AUDIT_EVIDENCE_LOOKUP_PARTIAL_CAPTURE_LINE } from "@/lib/governance/audit-evidence-lookup-partial-capture-copy";
import { SIGNED_RECORDS_LIST_PARTIAL_CAPTURE_LINE } from "@/lib/governance/signed-records-list-partial-capture-copy";
import { RESOURCE_HUB_CONFIG_PARTIAL_CAPTURE_EMPTY_LINE } from "@/lib/infra-evidence/resource-hub-config-partial-capture-copy";
import { REMEDIATION_WORKBENCH_WAVES_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/remediation-workbench-waves-empty-partial-capture-copy";
import { NEEDS_ATTENTION_INBOX_ALL_CLEAR_PARTIAL_CAPTURE_LINE } from "@/lib/operator/needs-attention-inbox-all-clear-partial-capture-copy";

describe("score-lift round68 batch honesty", () => {
  it("approval queue, needs attention, hub config, remediation waves, digests, audit lookup, compare, sealed records", () => {
    expect(GOVERNANCE_APPROVAL_QUEUE_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(NEEDS_ATTENTION_INBOX_ALL_CLEAR_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(RESOURCE_HUB_CONFIG_PARTIAL_CAPTURE_EMPTY_LINE).toContain("gaps");
    expect(REMEDIATION_WORKBENCH_WAVES_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(DIGESTS_BROWSE_SETUP_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(AUDIT_EVIDENCE_LOOKUP_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(COMPARE_INSUFFICIENT_FINALIZED_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(SIGNED_RECORDS_LIST_PARTIAL_CAPTURE_LINE).toContain("Partial");
  });
});