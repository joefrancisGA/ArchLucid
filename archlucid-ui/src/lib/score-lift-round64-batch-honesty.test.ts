import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_PARTIAL_CAPTURE_DISABLED_CTA_LINE } from "@/lib/architecture/first-review-partial-capture-disabled-cta-copy";
import { DIGEST_SUBSCRIPTIONS_VS_BROWSE_EMPTY_HONESTY_LINE } from "@/lib/digests/digest-subscriptions-vs-browse-empty-honesty-copy";
import { EXPORT_PARTIAL_CAPTURE_RECOVERY_MIDDLE_LINE } from "@/lib/exports/export-partial-capture-recovery-honesty-copy";
import { RESOURCE_HUB_FINDINGS_PARTIAL_CAPTURE_EMPTY_LINE } from "@/lib/infra-evidence/resource-hub-findings-partial-capture-copy";
import { REMEDIATION_FACTORY_PRIORITY_QUEUE_PARTIAL_RANK_LINE } from "@/lib/remediation-factory/remediation-factory-priority-queue-partial-rank-copy";

describe("score-lift round64 batch honesty", () => {
  it("export, hub, factory, digest, and first-review copy", () => {
    expect(EXPORT_PARTIAL_CAPTURE_RECOVERY_MIDDLE_LINE).toContain("unscanned");
    expect(RESOURCE_HUB_FINDINGS_PARTIAL_CAPTURE_EMPTY_LINE).toContain("gaps");
    expect(REMEDIATION_FACTORY_PRIORITY_QUEUE_PARTIAL_RANK_LINE).toContain("Reader");
    expect(DIGEST_SUBSCRIPTIONS_VS_BROWSE_EMPTY_HONESTY_LINE).toContain("Browse");
    expect(FIRST_REVIEW_PARTIAL_CAPTURE_DISABLED_CTA_LINE).toContain("gaps");
  });
});